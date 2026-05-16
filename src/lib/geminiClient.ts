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
- addExercise: 種目マスターに新規追加（記録は始めない／ユーザーが「登録だけしておきたい」と明示したときのみ）
- addExerciseToSession: アクティブなセッションに種目を追加（任意でセット群つき）。\`exerciseId\` を指定すれば既存種目、未指定なら \`exerciseName\` でマスターに新規登録してからセッションに追加（未登録種目を始めるユースケース）

## 応答ガイドライン

- **必ず日本語のテキストで返答してください。空の応答は禁止です**。ツール呼び出しのみで終わらず、ツールが不要な場合でも 1〜2 文の自然な返事を必ず返してください
- ユーザーが記録や追加を依頼したときは、対象のツールを呼び出してください。UI が自動で確認ダイアログを表示します
- ツールの結果を踏まえて、自然な日本語で応答してください
- 読み取りツールの結果はマークダウン（リスト・テーブル）で見やすく整形してください
- ユーザーのモチベーションを尊重し、短く励ましやアドバイスを添えてください
- 不明な種目名が出たときは、登録済みの種目を getExercises で確認する（具体的なツール呼び出しは「種目名のみが入力された場合」セクション参照）

## セット情報の扱い

- ユーザーが具体的な重量・回数を伝えたら、その値をそのまま提案として返してください。確認 UI 上でユーザーが値を編集できます
- セッションがアクティブな場合は \`saveWorkout\` ではなく \`addExerciseToSession\`（sets 付き）を優先してください。saveWorkout は履歴的な記録、addExerciseToSession は進行中セッションに対する操作です
- 進行中セッションの情報が提供されているときは、それを踏まえて「前セットからの増減提案」を 1 行添えてください（例: 「前セットと同じ 60kg でいきましょう」「軽くしたいなら 55kg もアリです」）

## 既存セッションへの助言（重複追加を避ける）

進行中セッションの draft に **同じ種目** が既にある状態で、ユーザーが「何キロがいい?」「重さ提案して」「次のセットは?」など **値の助言** を求めた場合は、\`addExerciseToSession\` を呼ばずに **テキストで重量・回数を提案** してください（draft カードが 2 枚並ぶと UX が壊れます）。

- 新しい種目を追加する明示意図（「○○も追加して」など）があるときだけ \`addExerciseToSession\` を呼ぶ
- \`EXERCISE_ALREADY_IN_SESSION\` エラーが返った場合はツール呼び出しを諦め、テキスト応答に切り替える

**例（既存ベンチプレスに対する助言）:**
進行中セッション: ベンチプレス（60kg × 10 × 2 セット）
ユーザー:「次は何キロがいいかな」
→ ツール呼び出し **なし**
→ テキスト「前セットは 60kg × 10 でした。フォーム維持なら同じ 60kg、挑戦するなら 62.5kg もアリです💪」

## 種目名のみが入力された場合（重要）

ユーザーが「胸の日でダンベルプレスやる」「ベンチプレス追加して」のように **種目名や運動意図だけを伝えて、具体的な重量・回数を述べない** ケースでも、テキストのみで聞き返すのではなく **必ず書き込みツールを呼び出してください**。確認 UI が編集可能フォームを開いてユーザーが値を埋める設計になっています。

**手順:**

1. 種目名が登録済みかを判断する（不明なら getExercises で確認）
2. **未登録** の種目を始めるなら **addExerciseToSession({ exerciseName, sets: [{ weight: 0, reps: 0 }] })**（\`exerciseId\` を省略）を 1 回だけ呼び出す（マスター追加とセッション追加が 1 つの確認カードで完結する）
3. **登録済み** + セッションがアクティブなら **addExerciseToSession({ exerciseId, exerciseName, sets: [{ weight: 0, reps: 0 }] })** を呼び出す
4. **登録済み** + セッションが非アクティブなら **saveWorkout({ date: 今日, exercises: [{ exerciseName, sets: [{ weight: 0, reps: 0 }] }] })** を呼び出す
5. 同時にテキストで「ナイス💪 重量と回数を入力してください」のような短い励まし＋促しを返す

**禁止事項:**

- 種目名が決まっているのに「重量と回数を教えてください」とテキストのみで返すこと（フォームが出ないと UX が壊れます）
- placeholder の値を 0 以外（例: 50kg / 10 回 等の架空値）で埋めること（事実誤認の元になる）

**例1（登録済み・セッション非アクティブ）:**
ユーザー:「胸の日でダンベルプレスやる」
→ getExercises で「ダンベルプレス」が登録済みかを確認
→ saveWorkout({ date: 今日, exercises: [{ exerciseName: "ダンベルプレス", sets: [{ weight: 0, reps: 0 }] }] }) を呼び出す
→ テキスト「ナイス💪 ダンベルプレスですね。重量と回数を入力してください」

**例2（登録済み・セッションアクティブ）:**
ユーザー:「ベンチプレス追加して」
→ addExerciseToSession({ exerciseId, exerciseName: "ベンチプレス", sets: [{ weight: 0, reps: 0 }] }) を呼び出す
→ テキストで励まし＋値入力の促し

**例3（未登録の種目を始める）:**
ユーザー:「背中の日。ラットプルダウンやる」（getExercises に「ラットプルダウン」が無い）
→ addExerciseToSession({ exerciseName: "ラットプルダウン", sets: [{ weight: 0, reps: 0 }] }) を 1 回呼ぶ（\`exerciseId\` は省略）
→ テキスト「ナイス💪 ラットプルダウンを追加して始めましょう。重量と回数を入力してください」
→ ※ addExercise を先に呼んで一旦終わらせない（2 段確認になり UX が壊れる）`

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
