import { useCallback, useRef } from 'react'
import type { Content } from '@google/generative-ai'
import {
  isAbortError,
  messagesToContents,
  nonEmptyOr,
  toFunctionResponseObject,
  EMPTY_RESPONSE_FALLBACK,
} from '../lib/chat/conversation'
import {
  buildWriteResultMessage,
  partitionFunctionCalls,
  toPendingActionData,
} from '../lib/chat/pendingAction'
import {
  createGeminiClient,
  buildSystemInstruction,
  getErrorMessage,
  type FunctionCallRequest,
  type GeminiClient,
} from '../lib/geminiClient'
import { executeReadTool, executeWriteTool } from '../lib/toolExecutor'
import { buildActiveSessionContext } from '../lib/sessionContext'
import { useChatStore } from '../stores/chatStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserProfileStore } from '../stores/userProfileStore'
import { nowISODateTimeString } from '../schemas/date'
import type { ToolCallResult } from '../types/chat'

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
          useChatStore.getState().addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: nonEmptyOr(firstResponse.text, EMPTY_RESPONSE_FALLBACK),
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

        const emitWriteResult = (
          call: FunctionCallRequest,
          assistantText: string | null | undefined,
          precedingReads: ToolCallResult[],
        ): void => {
          const data = toPendingActionData(call)
          if (!data) {
            useChatStore
              .getState()
              .setError('書き込み操作の内容を解釈できませんでした。')
            return
          }
          const result = executeWriteTool(call.name, call.args)
          useChatStore.getState().addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: nonEmptyOr(
              assistantText,
              buildWriteResultMessage(data, result),
            ),
            timestamp: nowISODateTimeString(),
            toolCalls: [
              ...precedingReads,
              { toolName: call.name, args: call.args, result },
            ],
          })
        }

        if (writeCall) {
          emitWriteResult(writeCall, firstResponse.text, readResults)
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
          emitWriteResult(followWriteCall, follow.text, readResults)
          return
        }

        useChatStore.getState().addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: nonEmptyOr(follow.text, EMPTY_RESPONSE_FALLBACK),
          timestamp: nowISODateTimeString(),
          toolCalls: readResults,
        })
      } catch (err) {
        if (isAbortError(err)) return
        console.error('[ai-chat] Gemini API error:', err)
        useChatStore.setState((s) => ({
          messages: s.messages.filter((m) => m.id !== userMessageId),
        }))
        const store = useChatStore.getState()
        store.setLastFailedInput(trimmed)
        store.setError(getErrorMessage(err))
      } finally {
        if (abortControllerRef.current === ctrl) {
          abortControllerRef.current = null
        }
        useChatStore.getState().setLoading(false)
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

  return {
    messages,
    isLoading,
    error,
    lastFailedInput,
    sendMessage,
    stopResponse,
    clearMessages,
    retryLastMessage,
  }
}
