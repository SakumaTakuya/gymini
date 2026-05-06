import { useCallback, useRef } from 'react'
import type { Content } from '@google/generative-ai'
import type { DateString } from '../schemas/date'
import {
  createGeminiClient,
  buildSystemInstruction,
  getErrorMessage,
  type FunctionCallRequest,
  type GeminiClient,
} from '../lib/geminiClient'
import { isWriteTool } from '../lib/toolDefinitions'
import {
  executeReadTool,
  executeWriteTool,
  parseSetsArg,
  type ToolExecutionResult,
} from '../lib/toolExecutor'
import { buildActiveSessionContext } from '../lib/sessionContext'
import { useChatStore } from '../stores/chatStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserProfileStore } from '../stores/userProfileStore'
import { nowISODateTimeString } from '../schemas/date'
import type {
  ChatMessage,
  PendingAction,
  PendingActionData,
  ToolCallResult,
} from '../types/chat'

type CreateClient = (apiKey: string, systemInstruction?: string) => GeminiClient

export const EMPTY_RESPONSE_FALLBACK =
  'ナイス！💪 種目名や重量・回数が決まったら教えてくれれば記録できますよ（例:「ダンベルプレスやる」「ベンチプレス60kg10回」）'

export type UseChatServiceOptions = {
  createClient?: CreateClient
}

export function useChatService(options: UseChatServiceOptions = {}) {
  const messages = useChatStore((s) => s.messages)
  const isLoading = useChatStore((s) => s.isLoading)
  const error = useChatStore((s) => s.error)

  const abortControllerRef = useRef<AbortController | null>(null)
  const pendingAssistantIdRef = useRef<string | null>(null)

  const createClient = useCallback<CreateClient>(
    (apiKey, systemInstruction) =>
      options.createClient
        ? options.createClient(apiKey, systemInstruction)
        : createGeminiClient({ apiKey, systemInstruction }),
    [options],
  )

  const clearMessages = useCallback(() => {
    useChatStore.getState().clearMessages()
  }, [])

  const stopResponse = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    const partialId = pendingAssistantIdRef.current
    if (partialId) {
      useChatStore.getState().removeMessage(partialId)
      pendingAssistantIdRef.current = null
    }
    useChatStore.getState().setLoading(false)
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (trimmed === '') return

      const settings = useSettingsStore.getState()
      const { profile } = useUserProfileStore.getState()
      if (!settings.hasApiKey) {
        useChatStore
          .getState()
          .setError(
            'AIチャットを利用するにはAPIキーの設定が必要です。設定画面からGemini APIキーを入力してください。',
          )
        return
      }

      abortControllerRef.current?.abort()
      const ctrl = new AbortController()
      abortControllerRef.current = ctrl

      const chat = useChatStore.getState()
      chat.setError(null)
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        timestamp: nowISODateTimeString(),
      }
      chat.addMessage(userMessage)
      chat.setLoading(true)

      try {
        const sessionContext = buildActiveSessionContext()
        const systemInstruction = buildSystemInstruction(
          profile,
          sessionContext,
        )
        const client = createClient(settings.apiKey, systemInstruction)
        const baseContents = messagesToContents(
          useChatStore.getState().messages,
        )

        const firstResponse = await client.generate(baseContents, ctrl.signal)

        if (
          firstResponse.functionCalls &&
          firstResponse.functionCalls.length > 0
        ) {
          const { readCalls, writeCall } = partitionFunctionCalls(
            firstResponse.functionCalls,
          )

          const readResults: ToolCallResult[] = readCalls.map((fc) => ({
            toolName: fc.name,
            args: fc.args,
            result: executeReadTool(fc.name, fc.args),
          }))

          if (writeCall) {
            cancelExistingPending()
            const pendingAction = buildPendingAction(writeCall)
            if (!pendingAction) {
              useChatStore
                .getState()
                .setError('書き込み操作の内容を解釈できませんでした。')
              return
            }
            const assistantMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content:
                firstResponse.text && firstResponse.text.trim() !== ''
                  ? firstResponse.text
                  : pendingAction.description,
              timestamp: nowISODateTimeString(),
              toolCalls: readResults.length > 0 ? readResults : undefined,
              pendingAction,
            }
            pendingAssistantIdRef.current = assistantMessage.id
            useChatStore.getState().addMessage(assistantMessage)
            pendingAssistantIdRef.current = null
            return
          }

          if (readCalls.length > 0) {
            // Gemini 2.5 系では functionCall に thought_signature が付与されており、
            // フォローアップで再構築するとシグネチャが欠落して 400 になる。
            // SDK が返した modelContent をそのまま送り返す。
            const modelTurn: Content = firstResponse.modelContent ?? {
              role: 'model',
              parts: readCalls.map((fc) => ({
                functionCall: { name: fc.name, args: fc.args },
              })),
            }
            const followUpContents: Content[] = [
              ...baseContents,
              modelTurn,
              {
                role: 'user',
                parts: readResults.map((r) => ({
                  functionResponse: {
                    name: r.toolName,
                    response: toFunctionResponseObject(r.result),
                  },
                })),
              },
            ]
            const follow = await client.generate(followUpContents, ctrl.signal)

            if (follow.functionCalls && follow.functionCalls.length > 0) {
              const { writeCall: followWriteCall } = partitionFunctionCalls(
                follow.functionCalls,
              )
              if (followWriteCall) {
                cancelExistingPending()
                const pendingAction = buildPendingAction(followWriteCall)
                if (!pendingAction) {
                  useChatStore
                    .getState()
                    .setError('書き込み操作の内容を解釈できませんでした。')
                  return
                }
                const assistantMessage: ChatMessage = {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content:
                    follow.text && follow.text.trim() !== ''
                      ? follow.text
                      : pendingAction.description,
                  timestamp: nowISODateTimeString(),
                  toolCalls: readResults.length > 0 ? readResults : undefined,
                  pendingAction,
                }
                pendingAssistantIdRef.current = assistantMessage.id
                useChatStore.getState().addMessage(assistantMessage)
                pendingAssistantIdRef.current = null
                return
              }
            }

            const assistantMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: nonEmptyOrFallback(follow.text),
              timestamp: nowISODateTimeString(),
              toolCalls: readResults,
            }
            pendingAssistantIdRef.current = assistantMessage.id
            useChatStore.getState().addMessage(assistantMessage)
            pendingAssistantIdRef.current = null
          }
          return
        }

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: nonEmptyOrFallback(firstResponse.text),
          timestamp: nowISODateTimeString(),
        }
        pendingAssistantIdRef.current = assistantMessage.id
        useChatStore.getState().addMessage(assistantMessage)
        pendingAssistantIdRef.current = null
      } catch (err) {
        if (isAbortError(err)) {
          return
        }
        console.error('[ai-chat] Gemini API error:', err)
        useChatStore.getState().setError(getErrorMessage(err))
      } finally {
        if (abortControllerRef.current === ctrl) {
          abortControllerRef.current = null
        }
        useChatStore.getState().setLoading(false)
      }
    },
    [createClient],
  )

  const approve = useCallback(
    async (messageId: string, editedData?: PendingActionData) => {
      const message = useChatStore
        .getState()
        .messages.find((m) => m.id === messageId)
      if (!message?.pendingAction) return
      if (message.pendingAction.status !== 'pending') return

      const effectiveAction: PendingAction = editedData
        ? { ...message.pendingAction, data: editedData }
        : message.pendingAction
      const { toolName, args } = pendingActionToToolCall(effectiveAction)
      const result = executeWriteTool(toolName, args)
      useChatStore.getState().updatePendingAction(messageId, 'approved')

      const resultMessage = buildWriteResultMessage(effectiveAction, result)
      useChatStore.getState().addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: resultMessage,
        timestamp: nowISODateTimeString(),
        toolCalls: [
          {
            toolName,
            args,
            result,
          },
        ],
      })
    },
    [],
  )

  const reject = useCallback((messageId: string) => {
    const message = useChatStore
      .getState()
      .messages.find((m) => m.id === messageId)
    if (!message?.pendingAction) return
    if (message.pendingAction.status !== 'pending') return

    useChatStore.getState().updatePendingAction(messageId, 'rejected')
    useChatStore.getState().addMessage({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'キャンセルしました。',
      timestamp: nowISODateTimeString(),
    })
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stopResponse,
    approve,
    reject,
    clearMessages,
  }
}

function messagesToContents(messages: ChatMessage[]): Content[] {
  // Gemini API は role が user/model で交互に並んでいることを要求する。
  // approve 後の結果メッセージなど assistant が連続した場合は本文を改行で連結し、
  // 先頭が model の場合は破棄する（user 起点でないと 400 になる）。
  const contents: Content[] = []
  for (const m of messages) {
    const text = m.content.trim()
    if (text === '') continue
    const role: 'user' | 'model' = m.role === 'user' ? 'user' : 'model'
    const last = contents[contents.length - 1]
    if (last && last.role === role) {
      const lastPart = last.parts[last.parts.length - 1]
      const prevText =
        lastPart && 'text' in lastPart && typeof lastPart.text === 'string'
          ? lastPart.text
          : ''
      last.parts = [{ text: prevText ? `${prevText}\n\n${text}` : text }]
      continue
    }
    contents.push({ role, parts: [{ text }] })
  }
  while (contents.length > 0 && contents[0].role === 'model') {
    contents.shift()
  }
  return contents
}

function partitionFunctionCalls(calls: FunctionCallRequest[]): {
  readCalls: FunctionCallRequest[]
  writeCall: FunctionCallRequest | null
} {
  const readCalls: FunctionCallRequest[] = []
  let writeCall: FunctionCallRequest | null = null
  for (const fc of calls) {
    if (isWriteTool(fc.name)) {
      if (!writeCall) writeCall = fc
    } else {
      readCalls.push(fc)
    }
  }
  return { readCalls, writeCall }
}

function cancelExistingPending() {
  const { messages, updatePendingAction } = useChatStore.getState()
  for (const m of messages) {
    if (m.pendingAction && m.pendingAction.status === 'pending') {
      updatePendingAction(m.id, 'rejected')
    }
  }
}

function buildPendingAction(call: FunctionCallRequest): PendingAction | null {
  const data = toPendingActionData(call)
  if (!data) return null
  return {
    id: crypto.randomUUID(),
    type: data.actionType,
    description: describePendingAction(data),
    data,
    status: 'pending',
  }
}

function toPendingActionData(
  call: FunctionCallRequest,
): PendingActionData | null {
  switch (call.name) {
    case 'saveWorkout': {
      const date = call.args.date
      const exercises = call.args.exercises
      if (typeof date !== 'string' || !Array.isArray(exercises)) return null
      const exList: Array<{
        exerciseName: string
        sets: Array<{ weight: number; reps: number }>
      }> = []
      for (const e of exercises) {
        if (
          typeof e !== 'object' ||
          e === null ||
          typeof (e as { exerciseName?: unknown }).exerciseName !== 'string' ||
          !Array.isArray((e as { sets?: unknown }).sets)
        ) {
          return null
        }
        exList.push(
          e as { exerciseName: string; sets: Array<{ weight: number; reps: number }> },
        )
      }
      return {
        actionType: 'saveWorkout',
        date: date as DateString,
        exercises: exList,
      }
    }
    case 'addExercise': {
      const name = call.args.name
      if (typeof name !== 'string') return null
      return { actionType: 'addExercise', name }
    }
    case 'addExerciseToSession': {
      const exerciseId = call.args.exerciseId
      const exerciseName = call.args.exerciseName
      if (typeof exerciseId !== 'string' || typeof exerciseName !== 'string')
        return null
      const parsed = parseSetsArg(call.args.sets)
      if (!parsed.ok) return null
      return {
        actionType: 'addExerciseToSession',
        exerciseId,
        exerciseName,
        ...(parsed.sets ? { sets: parsed.sets } : {}),
      }
    }
    case 'addExerciseAndLog': {
      const name = call.args.name
      if (typeof name !== 'string' || name.trim() === '') return null
      const parsed = parseSetsArg(call.args.sets)
      if (!parsed.ok) return null
      const sets =
        parsed.sets && parsed.sets.length > 0
          ? parsed.sets
          : [{ weight: 0, reps: 0 }]
      return { actionType: 'addExerciseAndLog', name, sets }
    }
    default:
      return null
  }
}

function describePendingAction(data: PendingActionData): string {
  switch (data.actionType) {
    case 'saveWorkout': {
      const lines = data.exercises.map((ex) => {
        const sets = ex.sets
          .map((s) => `${s.weight}kg × ${s.reps}回`)
          .join('、')
        return `${ex.exerciseName}: ${sets}`
      })
      return `以下のワークアウトを ${data.date} に記録しますか？\n${lines.join('\n')}`
    }
    case 'addExercise':
      return `「${data.name}」を種目マスターに追加しますか？`
    case 'addExerciseToSession': {
      if (data.sets && data.sets.length > 0) {
        const setsText = data.sets
          .map((s) => `${s.weight}kg × ${s.reps}回`)
          .join('、')
        return `「${data.exerciseName}」を現在のセッションに以下の内容で追加しますか？値は調整できます\n${setsText}`
      }
      return `「${data.exerciseName}」を現在のセッションに追加しますか？`
    }
    case 'addExerciseAndLog': {
      const setsText = data.sets
        .map((s) => `${s.weight}kg × ${s.reps}回`)
        .join('、')
      return `「${data.name}」を種目マスターに追加して、記録を始めますか？値は調整できます\n${setsText}`
    }
  }
}

function pendingActionToToolCall(action: PendingAction): {
  toolName: string
  args: Record<string, unknown>
} {
  switch (action.data.actionType) {
    case 'saveWorkout':
      return {
        toolName: 'saveWorkout',
        args: {
          date: action.data.date,
          exercises: action.data.exercises,
        },
      }
    case 'addExercise':
      return { toolName: 'addExercise', args: { name: action.data.name } }
    case 'addExerciseToSession':
      return {
        toolName: 'addExerciseToSession',
        args: {
          exerciseId: action.data.exerciseId,
          exerciseName: action.data.exerciseName,
          ...(action.data.sets ? { sets: action.data.sets } : {}),
        },
      }
    case 'addExerciseAndLog':
      return {
        toolName: 'addExerciseAndLog',
        args: {
          name: action.data.name,
          sets: action.data.sets,
        },
      }
  }
}

function buildWriteResultMessage(
  action: PendingAction,
  result: ToolExecutionResult,
): string {
  if (!result.success) {
    if (result.error === 'DUPLICATE_EXERCISE') {
      if (action.data.actionType === 'addExerciseAndLog') {
        return `「${action.data.name}」は既に種目マスターに登録されています。既存の種目で記録するなら「${action.data.name}やる」と教えてください。`
      }
      return 'その種目は既に登録されています。'
    }
    if (result.error === 'SESSION_NOT_ACTIVE') {
      return 'ワークアウトセッションが開始されていません。セッションを開始してから追加してください。'
    }
    if (result.error === 'EXERCISE_NOT_FOUND') {
      const missing = (result.data as { missingExercises?: string[] } | undefined)
        ?.missingExercises
      return missing && missing.length > 0
        ? `${missing.join('、')} が種目マスターに登録されていないため記録できませんでした。先に種目追加を行ってください。`
        : '種目が見つからなかったため記録できませんでした。'
    }
    return `実行に失敗しました：${result.error ?? '原因不明'}`
  }
  switch (action.data.actionType) {
    case 'saveWorkout':
      return 'ワークアウトを記録しました！お疲れ様でした。'
    case 'addExercise':
      return `「${action.data.name}」を種目マスターに追加しました。`
    case 'addExerciseToSession':
      return `「${action.data.exerciseName}」を現在のセッションに追加しました。`
    case 'addExerciseAndLog':
      return `「${action.data.name}」を種目に追加して記録を始めました！💪`
  }
}

function toFunctionResponseObject(value: unknown): object {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as object
  }
  return { value }
}

function nonEmptyOrFallback(text: string | null | undefined): string {
  if (typeof text !== 'string') return EMPTY_RESPONSE_FALLBACK
  return text.trim() === '' ? EMPTY_RESPONSE_FALLBACK : text
}

function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true
  if (err instanceof Error) {
    if (err.name === 'AbortError') return true
    if (err.name === 'GoogleGenerativeAIAbortError') return true
    if (err.message.includes('aborted') || err.message.includes('Aborted'))
      return true
  }
  return false
}
