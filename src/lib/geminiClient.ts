import {
  GoogleGenerativeAI,
  type Content,
  type FunctionDeclaration,
} from '@google/generative-ai'
import { TOOL_DECLARATIONS } from './toolDefinitions'
import { SYSTEM_INSTRUCTION } from './prompts/systemInstruction'
import type { TrainingGoal, UserProfile } from '../stores/userProfileStore'
import { todayDateString } from '../schemas/date'

export const GEMINI_MODEL = 'gemini-3-flash-preview'
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

const TRAINING_GOAL_LABELS: Record<TrainingGoal, string> = {
  muscle_gain: '筋肥大（サイズアップ）',
  strength: '筋力アップ（パワー）',
  fat_loss: '減量・ダイエット',
  maintenance: '維持・健康増進',
  performance: '競技パフォーマンス向上',
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

export function buildSystemInstruction(
  profile: UserProfile | null,
  sessionContext?: string | null,
): string {
  const todaySection = `\n\n## 今日の日付\n今日の日付は ${todayDateString()} です。日付が明示されていない場合はこの日付を使用してください。`
  const sessionSection =
    sessionContext && sessionContext.trim() !== ''
      ? `\n\n## 進行中のセッション\n${sessionContext}\n\n上記のセッション状況を踏まえて、次セットの重量・回数のアドバイスや、進捗に応じた助言をしてください。`
      : ''

  const profileEmpty =
    !profile ||
    (profile.birthYear === null &&
      profile.weightKg === null &&
      profile.heightCm === null &&
      profile.trainingGoal === null)

  if (profileEmpty) return SYSTEM_INSTRUCTION + sessionSection + todaySection

  const { birthYear, weightKg, heightCm, trainingGoal } = profile
  const lines: string[] = []
  if (birthYear !== null) {
    const age = new Date().getFullYear() - birthYear
    lines.push(`- 年齢: ${age}歳（${birthYear}年生まれ）`)
  }
  if (weightKg !== null) {
    lines.push(`- 体重: ${weightKg}kg`)
  }
  if (heightCm !== null) {
    let line = `- 身長: ${heightCm}cm`
    if (weightKg !== null) {
      const bmi = weightKg / Math.pow(heightCm / 100, 2)
      line += `（BMI: ${bmi.toFixed(1)}）`
    }
    lines.push(line)
  }
  if (trainingGoal !== null) {
    lines.push(`- トレーニング目的: ${TRAINING_GOAL_LABELS[trainingGoal]}`)
  }

  return `${SYSTEM_INSTRUCTION}\n\n## ユーザープロフィール\n${lines.join('\n')}\n\n上記の情報を踏まえてアドバイスやメニュー提案を個人化してください。${sessionSection}${todaySection}`
}

export type GeminiClientConfig = {
  apiKey: string
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
    model: GEMINI_MODEL,
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
