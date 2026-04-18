import {
  GoogleGenerativeAI,
  type Content,
  type FunctionDeclaration,
} from '@google/generative-ai'
import { TOOL_DECLARATIONS } from './toolDefinitions'

export const GEMINI_MODEL = 'gemini-flash-latest'
export const MAX_HISTORY_MESSAGES = 50

const SYSTEM_INSTRUCTION = `あなたは筋トレをサポートする日本語のAIコーチです。

ユーザーはワークアウトの記録・参照を自然言語で依頼してきます。会話文脈から必要なツールを自律的に呼び出してください。

## ツールの使い分け

**読み取り操作（ユーザー確認なしで実行して良い）:**
- getRecentWorkouts: 最近のワークアウトを一覧で参照
- getWorkoutsByExercise: 種目名で絞り込んで参照
- getWorkoutsByDate: 日付指定で参照
- getWorkoutSummary: 週・月単位の集計
- getExercises: 登録済み種目の一覧

**書き込み操作（UIでユーザー確認が必須）:**
- saveWorkout: ワークアウト記録の保存
- addExercise: 種目マスターに新規追加
- addExerciseToSession: アクティブなセッションに種目を追加

## 応答ガイドライン

- ユーザーが記録や追加を依頼したときは、対象のツールを呼び出してください。UI が自動で確認ダイアログを表示します
- ツールの結果を踏まえて、自然な日本語で応答してください
- 読み取りツールの結果はマークダウン（リスト・テーブル）で見やすく整形してください
- ユーザーのモチベーションを尊重し、短く励ましやアドバイスを添えてください
- 不明な種目名が出たときは、登録済みの種目を getExercises で確認してから saveWorkout を呼び出すこと`

export type FunctionCallRequest = {
  name: string
  args: Record<string, unknown>
}

export type GeminiChatResponse = {
  text: string | null
  functionCalls: FunctionCallRequest[] | null
}

export type GeminiClientConfig = {
  apiKey: string
  toolDeclarations?: FunctionDeclaration[]
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
    systemInstruction: SYSTEM_INSTRUCTION,
  })

  return {
    async generate(contents, abortSignal) {
      const trimmed = contents.slice(-MAX_HISTORY_MESSAGES)
      const result = await model.generateContent(
        { contents: trimmed },
        abortSignal ? { signal: abortSignal } : undefined,
      )
      const response = result.response
      const functionCalls = response.functionCalls() ?? null
      const text = (() => {
        try {
          return response.text() || null
        } catch {
          return null
        }
      })()
      return {
        text,
        functionCalls: functionCalls
          ? functionCalls.map((fc) => ({
              name: fc.name,
              args: fc.args as Record<string, unknown>,
            }))
          : null,
      }
    },
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message

    if (msg.includes('API_KEY_INVALID') || msg.includes('401')) {
      return 'APIキーが無効です。設定画面で正しいAPIキーを入力してください。'
    }
    if (msg.includes('429') || msg.includes('RATE_LIMIT') || msg.includes('quota')) {
      return 'リクエスト制限に達しました。しばらく待ってから再度お試しください。'
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
