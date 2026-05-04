import {
  GoogleGenerativeAI,
  type Content,
  type FunctionDeclaration,
} from '@google/generative-ai'
import { TOOL_DECLARATIONS } from './toolDefinitions'
import type { TrainingGoal, UserProfile } from '../stores/userProfileStore'
import { todayDateString } from '../schemas/date'

export const GEMINI_MODEL = 'gemini-flash-latest'
export const MAX_HISTORY_MESSAGES = 50

const TRAINING_GOAL_LABELS: Record<TrainingGoal, string> = {
  muscle_gain: '筋肥大（サイズアップ）',
  strength: '筋力アップ（パワー）',
  fat_loss: '減量・ダイエット',
  maintenance: '維持・健康増進',
  performance: '競技パフォーマンス向上',
}

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
- addExerciseToSession: アクティブなセッションに種目を追加（任意でセット群つき）

## 応答ガイドライン

- **必ず日本語のテキストで返答してください。空の応答は禁止です**。ツール呼び出しのみで終わらず、ツールが不要な場合でも 1〜2 文の自然な返事を必ず返してください
- ユーザーが「〜しようと思う」「これからやる」のような意思表示をした場合は、励ましつつ「重量と回数を教えてくれれば記録します」のように次のアクションを提案してください
- ユーザーが記録や追加を依頼したときは、対象のツールを呼び出してください。UI が自動で確認ダイアログを表示します
- ツールの結果を踏まえて、自然な日本語で応答してください
- 読み取りツールの結果はマークダウン（リスト・テーブル）で見やすく整形してください
- ユーザーのモチベーションを尊重し、短く励ましやアドバイスを添えてください
- 不明な種目名が出たときは、登録済みの種目を getExercises で確認してから saveWorkout を呼び出すこと

## セット情報の扱い

- ユーザーが具体的な重量・回数を伝えたら、その値をそのまま提案として返してください。確認 UI 上でユーザーが値を編集できます
- セッションがアクティブな場合は \`saveWorkout\` ではなく \`addExerciseToSession\`（sets 付き）を優先してください。saveWorkout は履歴的な記録、addExerciseToSession は進行中セッションに対する操作です
- 進行中セッションの情報が提供されているときは、それを踏まえて「前セットからの増減提案」を 1 行添えてください（例: 「前セットと同じ 60kg でいきましょう」「軽くしたいなら 55kg もアリです」）`

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
      const result = await model.generateContent(
        { contents: trimmed },
        abortSignal ? { signal: abortSignal } : undefined,
      )
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
