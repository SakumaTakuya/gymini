import {
  GoogleGenerativeAI,
  type Content,
  type FunctionDeclaration,
} from '@google/generative-ai'
import { TOOL_DECLARATIONS } from './toolDefinitions'
import { SYSTEM_INSTRUCTION } from './prompts/systemInstruction'
import { DEFAULT_GEMINI_MODEL } from './geminiModels'

export { buildSystemInstruction } from './prompts/buildSystemInstruction'

/** 後方互換のため維持する既定モデル。選択モデルは settingsStore 経由で渡る。 */
export const GEMINI_MODEL = DEFAULT_GEMINI_MODEL
export const MAX_HISTORY_MESSAGES = 50
export const GEMINI_TIMEOUT_MS = 30_000

// Distinct from a user-initiated abort so it surfaces an error instead of being
// swallowed by isAbortError. The message intentionally omits "abort" wording.
export class GeminiTimeoutError extends Error {
  constructor() {
    super('Gemini request timed out')
    this.name = 'GeminiTimeoutError'
  }
}

export type FunctionCallRequest = {
  name: string
  args: Record<string, unknown>
}

export type GeminiChatResponse = {
  text: string | null
  functionCalls: FunctionCallRequest[] | null
  modelContent: Content | null
}

export type GeminiClientConfig = {
  apiKey: string
  model?: string
  toolDeclarations?: FunctionDeclaration[]
  systemInstruction?: string
}

export type GeminiClient = {
  generate: (
    contents: Content[],
    abortSignal?: AbortSignal,
  ) => Promise<GeminiChatResponse>
}

export function createGeminiClient(config: GeminiClientConfig): GeminiClient {
  const genAI = new GoogleGenerativeAI(config.apiKey)
  const model = genAI.getGenerativeModel({
    model: config.model ?? GEMINI_MODEL,
    tools: [
      {
        functionDeclarations: config.toolDeclarations ?? TOOL_DECLARATIONS,
      },
    ],
    systemInstruction: config.systemInstruction ?? SYSTEM_INSTRUCTION,
  })

  return {
    async generate(contents, abortSignal) {
      const trimmed = contents.slice(-MAX_HISTORY_MESSAGES)
      const timeoutController = new AbortController()
      const timer = setTimeout(
        () => timeoutController.abort(),
        GEMINI_TIMEOUT_MS,
      )
      const signal = abortSignal
        ? AbortSignal.any([abortSignal, timeoutController.signal])
        : timeoutController.signal
      let result: Awaited<ReturnType<typeof model.generateContent>>
      try {
        result = await model.generateContent({ contents: trimmed }, { signal })
      } catch (err) {
        if (timeoutController.signal.aborted && !abortSignal?.aborted) {
          throw new GeminiTimeoutError()
        }
        throw err
      } finally {
        clearTimeout(timer)
      }
      const response = result.response
      const functionCalls = (() => {
        try {
          return response.functionCalls() ?? null
        } catch {
          return null
        }
      })()
      const text = (() => {
        try {
          return response.text() || null
        } catch {
          return null
        }
      })()
      const modelContent = (() => {
        const candidate = response.candidates?.[0]
        if (!candidate?.content) return null
        return {
          role: 'model',
          parts: candidate.content.parts ?? [],
        } satisfies Content
      })()
      return {
        text,
        functionCalls: functionCalls
          ? functionCalls.map((fc) => ({
              name: fc.name,
              args: fc.args as Record<string, unknown>,
            }))
          : null,
        modelContent,
      }
    },
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof GeminiTimeoutError) {
    return '応答がタイムアウトしました。ネットワーク状況を確認して、もう一度お試しください。'
  }
  if (error instanceof Error) {
    const msg = error.message

    if (
      msg.includes('API_KEY_INVALID') ||
      msg.includes('UNAUTHENTICATED') ||
      /\b401\b/.test(msg)
    ) {
      return 'APIキーが無効です。設定画面で正しいAPIキーを入力してください。'
    }
    if (
      /\b429\b/.test(msg) ||
      msg.includes('RATE_LIMIT') ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('quota')
    ) {
      return 'リクエスト制限に達しました。しばらく待ってから再度お試しください。'
    }
    if (msg.includes('SAFETY') || msg.includes('blocked')) {
      return '安全フィルターにより応答できませんでした。表現を変えてお試しください。'
    }
    if (/\b400\b/.test(msg) || msg.includes('INVALID_ARGUMENT')) {
      return 'リクエスト形式に問題が発生しました。会話をクリアしてやり直してください。'
    }
    if (
      msg.includes('fetch') ||
      msg.includes('network') ||
      msg.includes('Network')
    ) {
      return 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
    }
  }
  return '予期しないエラーが発生しました。もう一度お試しください。'
}
