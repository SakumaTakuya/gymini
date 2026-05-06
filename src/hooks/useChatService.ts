import { useCallback, useRef } from 'react'
import type { Content } from '@google/generative-ai'
import {
  EMPTY_RESPONSE_FALLBACK,
  isAbortError,
  messagesToContents,
  nonEmptyOrFallback,
  toFunctionResponseObject,
} from '../lib/chat/conversation'
import {
  buildPendingAction,
  buildWriteResultMessage,
  partitionFunctionCalls,
  pendingActionToToolCall,
} from '../lib/chat/pendingAction'
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
import type {
  ChatMessage,
  PendingAction,
  PendingActionData,
  ToolCallResult,
} from '../types/chat'

export { EMPTY_RESPONSE_FALLBACK }

type CreateClient = (apiKey: string, systemInstruction?: string) => GeminiClient

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

  const addPendingAssistantMessage = useCallback(
    (message: ChatMessage) => {
      pendingAssistantIdRef.current = message.id
      useChatStore.getState().addMessage(message)
      pendingAssistantIdRef.current = null
    },
    [],
  )

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
      chat.addMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        timestamp: nowISODateTimeString(),
      })
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
          !firstResponse.functionCalls ||
          firstResponse.functionCalls.length === 0
        ) {
          addPendingAssistantMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: nonEmptyOrFallback(firstResponse.text),
            timestamp: nowISODateTimeString(),
          })
          return
        }

        const { readCalls, writeCall } = partitionFunctionCalls(
          firstResponse.functionCalls,
        )
        const readResults: ToolCallResult[] = readCalls.map((fc) => ({
          toolName: fc.name,
          args: fc.args,
          result: executeReadTool(fc.name, fc.args),
        }))

        if (writeCall) {
          if (
            !emitPendingAssistant({
              writeCall,
              text: firstResponse.text,
              readResults,
              addPendingAssistantMessage,
            })
          ) {
            return
          }
          return
        }

        if (readCalls.length === 0) return

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

        const followWriteCall = follow.functionCalls
          ? partitionFunctionCalls(follow.functionCalls).writeCall
          : null
        if (followWriteCall) {
          emitPendingAssistant({
            writeCall: followWriteCall,
            text: follow.text,
            readResults,
            addPendingAssistantMessage,
          })
          return
        }

        addPendingAssistantMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: nonEmptyOrFallback(follow.text),
          timestamp: nowISODateTimeString(),
          toolCalls: readResults,
        })
      } catch (err) {
        if (isAbortError(err)) return
        console.error('[ai-chat] Gemini API error:', err)
        useChatStore.getState().setError(getErrorMessage(err))
      } finally {
        if (abortControllerRef.current === ctrl) {
          abortControllerRef.current = null
        }
        useChatStore.getState().setLoading(false)
      }
    },
    [createClient, addPendingAssistantMessage],
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

      useChatStore.getState().addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: buildWriteResultMessage(effectiveAction, result),
        timestamp: nowISODateTimeString(),
        toolCalls: [{ toolName, args, result }],
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

function cancelExistingPending() {
  const { messages, updatePendingAction } = useChatStore.getState()
  for (const m of messages) {
    if (m.pendingAction && m.pendingAction.status === 'pending') {
      updatePendingAction(m.id, 'rejected')
    }
  }
}

function emitPendingAssistant(params: {
  writeCall: Parameters<typeof buildPendingAction>[0]
  text: string | null | undefined
  readResults: ToolCallResult[]
  addPendingAssistantMessage: (m: ChatMessage) => void
}): boolean {
  const { writeCall, text, readResults, addPendingAssistantMessage } = params
  cancelExistingPending()
  const pendingAction = buildPendingAction(writeCall)
  if (!pendingAction) {
    useChatStore
      .getState()
      .setError('書き込み操作の内容を解釈できませんでした。')
    return false
  }
  addPendingAssistantMessage({
    id: crypto.randomUUID(),
    role: 'assistant',
    content:
      text && text.trim() !== '' ? text : pendingAction.description,
    timestamp: nowISODateTimeString(),
    toolCalls: readResults.length > 0 ? readResults : undefined,
    pendingAction,
  })
  return true
}
