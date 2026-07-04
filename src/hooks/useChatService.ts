import { useCallback, useRef } from 'react'
import {
  isAbortError,
  messagesToContents,
  nonEmptyOr,
  EMPTY_RESPONSE_FALLBACK,
} from '../lib/chat/conversation'
import {
  buildWriteResultMessage,
  toPendingActionData,
} from '../lib/chat/pendingAction'
import { runConversationTurn } from '../lib/chat/chatService'
import { buildAssistantMessage } from '../lib/chat/messages'
import {
  createGeminiClient,
  buildSystemInstruction,
  getErrorMessage,
  type GeminiClient,
} from '../lib/geminiClient'
import { executeReadTool, executeWriteTool } from '../lib/toolExecutor'
import { buildActiveSessionContext } from '../lib/sessionContext'
import { useChatStore } from '../stores/chatStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserProfileStore } from '../stores/userProfileStore'
import { nowISODateTimeString } from '../schemas/date'
import type { ProposedAction } from '../types/chat'

type CreateClient = (apiKey: string, systemInstruction?: string) => GeminiClient

export type UseChatServiceOptions = {
  createClient?: CreateClient
}

export function useChatService(options: UseChatServiceOptions = {}) {
  const messages = useChatStore((s) => s.messages)
  const isLoading = useChatStore((s) => s.isLoading)
  const error = useChatStore((s) => s.error)
  const lastFailedInput = useChatStore((s) => s.lastFailedInput)

  const abortControllerRef = useRef<AbortController | null>(null)

  // options はデフォルト引数 {} により毎レンダー新しい参照になるため、
  // 依存には options 自体ではなく中身の関数だけを使う。そうしないと
  // createClient → sendMessage → triggerAction が毎レンダー再生成される。
  const injectedCreateClient = options.createClient
  const createClient = useCallback<CreateClient>(
    (apiKey, systemInstruction) =>
      injectedCreateClient
        ? injectedCreateClient(apiKey, systemInstruction)
        : createGeminiClient({
            apiKey,
            systemInstruction,
            model: useSettingsStore.getState().model,
          }),
    [injectedCreateClient],
  )

  const clearMessages = useCallback(() => {
    useChatStore.getState().clearMessages()
  }, [])

  const stopResponse = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    useChatStore.getState().setLoading(false)
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (trimmed === '') return

      const settings = useSettingsStore.getState()
      const { profile } = useUserProfileStore.getState()
      if (!settings.hasApiKey) {
        const store = useChatStore.getState()
        store.setError(
          'AIチャットを利用するにはAPIキーの設定が必要です。設定画面からGemini APIキーを入力してください。',
        )
        store.setLastFailedInput(trimmed)
        return
      }

      abortControllerRef.current?.abort()
      const ctrl = new AbortController()
      abortControllerRef.current = ctrl

      const chat = useChatStore.getState()
      chat.setError(null)
      chat.setLastFailedInput(null)
      const userMessageId = crypto.randomUUID()
      chat.addMessage({
        id: userMessageId,
        role: 'user',
        content: trimmed,
        timestamp: nowISODateTimeString(),
      })
      chat.setLoading(true)

      try {
        const sessionContext = buildActiveSessionContext()
        const systemInstruction = buildSystemInstruction(profile, sessionContext)
        const client = createClient(settings.apiKey, systemInstruction)
        const baseContents = messagesToContents(
          useChatStore.getState().messages,
        )

        const outcome = await runConversationTurn({
          baseContents,
          client,
          executeRead: executeReadTool,
          signal: ctrl.signal,
        })

        switch (outcome.kind) {
          case 'text': {
            useChatStore
              .getState()
              .addMessage(
                buildAssistantMessage(
                  nonEmptyOr(outcome.text, EMPTY_RESPONSE_FALLBACK),
                  outcome.toolCalls,
                ),
              )
            return
          }
          case 'write': {
            const data = toPendingActionData(outcome.call)
            if (!data) {
              useChatStore
                .getState()
                .setError('書き込み操作の内容を解釈できませんでした。')
              return
            }
            const result = executeWriteTool(
              outcome.call.name,
              outcome.call.args,
            )
            useChatStore.getState().addMessage(
              buildAssistantMessage(
                nonEmptyOr(
                  outcome.assistantText,
                  buildWriteResultMessage(data, result),
                ),
                [
                  ...outcome.precedingReads,
                  {
                    toolName: outcome.call.name,
                    args: outcome.call.args,
                    result,
                  },
                ],
              ),
            )
            return
          }
          case 'proposal': {
            useChatStore.getState().addMessage(
              outcome.precedingReads
                ? { ...outcome.proposalMsg, toolCalls: outcome.precedingReads }
                : outcome.proposalMsg,
            )
            return
          }
          default: {
            // 将来 TurnOutcome に variant を追加したとき TS でハンドラ漏れを検出する
            const _exhaustive: never = outcome
            throw new Error(
              `Unhandled TurnOutcome kind: ${JSON.stringify(_exhaustive)}`,
            )
          }
        }
      } catch (err) {
        if (isAbortError(err)) return
        console.error('[ai-chat] Gemini API error:', err)
        const store = useChatStore.getState()
        store.removeMessage(userMessageId)
        store.setLastFailedInput(trimmed)
        store.setError(getErrorMessage(err))
      } finally {
        // この turn がまだ「現行のリクエスト」である場合のみ loading を畳む。
        // 新しい sendMessage に置き換えられた turn（abort された旧 turn）が
        // 無条件に setLoading(false) すると、進行中の新 turn のスピナーを
        // 消してしまう。stopResponse 経由の中断はそちらで false 済み。
        if (abortControllerRef.current === ctrl) {
          abortControllerRef.current = null
          useChatStore.getState().setLoading(false)
        }
      }
    },
    [createClient],
  )

  const retryLastMessage = useCallback(async () => {
    const { lastFailedInput: input, isLoading: loading } =
      useChatStore.getState()
    if (!input || loading) return
    await sendMessage(input)
  }, [sendMessage])

  const triggerAction = useCallback(
    async (messageId: string, action: ProposedAction) => {
      const chatState = useChatStore.getState()
      const target = chatState.messages.find((m) => m.id === messageId)
      if (!target) return
      if (target.consumedActionId) return

      chatState.consumeAction(messageId, action.id)

      switch (action.kind) {
        case 'start-exercise': {
          const exerciseName = action.payload?.exerciseName
          if (!exerciseName) return
          // 既存種目名 → id の解決は executeAddExerciseToSession 側で行う
          // （直接 write 経路と提案経路で同じ解決を共有するため）。
          const args: Record<string, unknown> = {
            exerciseName,
            sets: [{ weight: 0, reps: 0 }],
          }
          if (action.payload?.exerciseId) {
            args.exerciseId = action.payload.exerciseId
          }
          const result = executeWriteTool('addExerciseToSession', args)
          const data = toPendingActionData({
            name: 'addExerciseToSession',
            args,
          })
          useChatStore.getState().addMessage(
            buildAssistantMessage(
              data
                ? buildWriteResultMessage(data, result)
                : '提案を実行できませんでした。',
              [{ toolName: 'addExerciseToSession', args, result }],
            ),
          )
          return
        }
        case 'show-history': {
          const exerciseName = action.payload?.exerciseName
          if (!exerciseName) return
          const args = { exerciseName }
          const result = executeReadTool('getWorkoutsByExercise', args)
          const content = formatHistoryResultMessage(exerciseName, result)
          useChatStore.getState().addMessage(
            buildAssistantMessage(content, [
              { toolName: 'getWorkoutsByExercise', args, result },
            ]),
          )
          return
        }
        case 'ask-followup': {
          const prompt = action.payload?.prompt ?? action.label
          await sendMessage(prompt)
          return
        }
      }
    },
    [sendMessage],
  )

  return {
    messages,
    isLoading,
    error,
    lastFailedInput,
    sendMessage,
    stopResponse,
    clearMessages,
    retryLastMessage,
    triggerAction,
  }
}

function formatHistoryResultMessage(
  exerciseName: string,
  result: unknown,
): string {
  if (
    result &&
    typeof result === 'object' &&
    'success' in result &&
    (result as { success?: unknown }).success === false
  ) {
    return `${exerciseName} の履歴を取得できませんでした。`
  }
  const records = Array.isArray(result)
    ? result
    : Array.isArray((result as { workouts?: unknown[] } | undefined)?.workouts)
      ? (result as { workouts: unknown[] }).workouts
      : []
  if (records.length === 0) {
    return `${exerciseName} の履歴はまだありません。`
  }
  return `${exerciseName} の直近の記録 ${records.length} 件を表示します。`
}
