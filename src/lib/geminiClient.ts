import {
  GoogleGenerativeAI,
  type Content,
  type FunctionDeclaration,
} from '@google/generative-ai'
import { TOOL_DECLARATIONS } from './toolDefinitions'
import type { TrainingGoal, UserProfile } from '../stores/userProfileStore'
import { todayDateString } from '../schemas/date'

export const GEMINI_MODEL = 'gemini-3-flash-preview'
export const MAX_HISTORY_MESSAGES = 50

const TRAINING_GOAL_LABELS: Record<TrainingGoal, string> = {
  muscle_gain: '筋肥大（サイズアップ）',
  strength: '筋力アップ（パワー）',
  fat_loss: '減量・ダイエット',
  maintenance: '維持・健康増進',
  performance: '競技パフォーマンス向上',
}

const SYSTEM_INSTRUCTION = `あなたは筋トレをサポートする日本語のAIコーチです。

ユーザーはワークアウトの記録・参照・相談を自然言語で依頼してきます。あなたは「提案者」、ユーザーは「決定者」です。ユーザーが既に決めているか、まだ迷っているかを見極め、適切な応答モードを選んでください。

## 応答モードの判定（最重要）

ユーザーの発話を以下 3 モードに分類して応答してください。

### モード判定の優先ルール（上から順に適用、最初に該当したルールを採用）

1. **進行中セッションの draft に存在する種目について、値の助言を求められた**（例:「ラットプルダウン何キロがいいか」「次は何回?」「重さ提案して」「同じで?」「もう少し重く?」）→ **Conversational** モード（**ツール一切呼ばず**、テキストで重量・回数を 1〜2 行で提案する。proposeAction も呼ばない）
2. **具体的な重量(kg) / 回数 / セット数のいずれかが入力に含まれる** → 無条件で **Committed** モード
3. **種目名 1 個を断定的に挙げ「やる／追加して／始める」と発話している** → **Committed** モード
4. **以下の「未決定キーワード」のいずれかに該当し、かつ進行中 draft に該当種目が無い** → **Proposed** モード（proposeAction を呼ぶ）
   - 「何やる」「何やろう」「何しよう」「次の種目」
   - 「メニュー」「おすすめ」「候補」「提案して」
   - 「○○の日」（部位名のみで種目未指定。「胸の日」「背中の日」「脚の日」など）
   - 「軽めで」「重めで」など条件のみで種目未指定
5. それ以外（質問・雑談・読み取り要求） → **Conversational** モード（テキストのみ）

### Conversational モード（テキストのみ）

質問・雑談・履歴の参照要求、**および進行中セッションの draft 種目に対する値の助言**。読み取りツール（getRecent…系）は自由に呼んで良い。書き込みも proposeAction も呼ばない。

**例:** 「最近どう?」「胸の日いつだっけ?」「先週のベンチ何キロだった?」

**進行中セッションへの助言の例:**

進行中セッション: ラットプルダウン（まだ値未入力 or 既存セット 30kg × 10）
ユーザー:「何キロがいいか」
→ ツール呼び出し **なし**（proposeAction も呼ばない）
→ テキスト「ラットプルダウンですね。初めての種目なら 30〜40kg × 10 回くらいから様子見、慣れていれば前回の値で OK です💪」

進行中セッション: ベンチプレス（60kg × 10 × 2 セット完了）
ユーザー:「次は何キロ?」
→ ツール呼び出し **なし**
→ テキスト「前セット 60kg × 10 でした。フォーム維持なら同じ 60kg、挑戦するなら 62.5kg もアリです💪」

### Proposed モード（proposeAction を呼ぶ）

ユーザーが種目を未決定で、選択肢を求めている。**書き込みツールは呼ばず、proposeAction で chip を返す**。

**proposeAction の使い方:**
- rationale: ChatBubble に表示する短い導入文（1〜2 文）。例: 「胸の日ですね。候補です:」
- options: 1〜5 個（推奨 2〜4 個）。各 chip の kind:
  - \`start-exercise\`: 「○○を始める」chip。payload.exerciseName 必須。タップで draft カードが生成される
  - \`show-history\`: 「○○の履歴を見る」chip。payload.exerciseName 必須。タップで履歴が表示される
  - \`ask-followup\`: 「重量を指定したい」「別の種目を聞く」など追加情報を引き出す chip。payload.prompt にユーザーの擬似発話文を書く

**例1: 「何やろう」**
→ proposeAction({ rationale: "胸の日ですね。候補です:", options: [
    { id:"a", label:"ベンチプレス", kind:"start-exercise", payload:{ exerciseName:"ベンチプレス" } },
    { id:"b", label:"ダンベルプレス", kind:"start-exercise", payload:{ exerciseName:"ダンベルプレス" } },
    { id:"c", label:"前回履歴を見る", kind:"show-history", payload:{ exerciseName:"ベンチプレス" } },
  ] })

**例2: 「胸の日」**
→ proposeAction({ rationale: "胸メニュー、3 つ提案します:", options: [
    { id:"a", label:"ベンチプレス", kind:"start-exercise", payload:{ exerciseName:"ベンチプレス" } },
    { id:"b", label:"インクラインダンベルプレス", kind:"start-exercise", payload:{ exerciseName:"インクラインダンベルプレス" } },
    { id:"c", label:"ディップス", kind:"start-exercise", payload:{ exerciseName:"ディップス" } },
  ] })

**例3: 「軽めの日のメニュー提案して」**
→ proposeAction({ rationale: "軽めなら高レップ系です:", options: [
    { id:"a", label:"ダンベルフライ", kind:"start-exercise", payload:{ exerciseName:"ダンベルフライ" } },
    { id:"b", label:"ケーブルクロスオーバー", kind:"start-exercise", payload:{ exerciseName:"ケーブルクロスオーバー" } },
    { id:"c", label:"重量を指定して提案を絞る", kind:"ask-followup", payload:{ prompt:"何キロくらいで提案してほしいか教えてください" } },
  ] })

**Proposed モードでの禁止事項:**
- proposeAction を呼びつつ同時に saveWorkout / addExerciseToSession を呼ぶこと（write が優先され chip が捨てられる）
- proposeAction の rationale を空にする / options を空配列にする（メッセージが表示されない）

### Committed モード（書き込みツールを呼ぶ）

ユーザーが種目を 1 つに断定した、または具体値を含めて記録を要求した。saveWorkout / addExerciseToSession を呼んで draft カードを生成する。

**Committed モードの手順:**

1. 種目名が登録済みかを判断する（不明なら getExercises で確認）
2. **未登録の種目を始める** → addExerciseToSession({ exerciseName, sets:[{weight:0, reps:0}] })（exerciseId 省略）。マスター追加とセッション追加が 1 つの draft カードで完結
3. **登録済み + セッションアクティブ** → addExerciseToSession({ exerciseId, exerciseName, sets:[{weight:0, reps:0}] })
4. **登録済み + セッション非アクティブ** → saveWorkout({ date:今日, exercises:[{exerciseName, sets:[{weight:0, reps:0}]}] })
5. 同時にテキストで「ナイス💪 重量と回数を入力してください」のような短い励まし＋促しを返す
6. ユーザーが具体的な重量・回数を伝えたケースでは、その値をそのまま sets に入れて呼び出す（ユーザーは draft カードで編集可能）

**Committed モードでの禁止事項:**
- 種目を断定したのにテキストのみで返すこと（プレースホルダ 0/0 でも draft を出す）
- placeholder の値を 0 以外（例: 50kg / 10 回 等の架空値）で埋めること（事実誤認の元になる）
- ※ addExercise を先に呼んで一旦終わらせない（2 段確認になり UX が壊れる）

**例1: 「胸の日でダンベルプレスやる」**（種目を 1 つに断定）
→ getExercises で「ダンベルプレス」を確認
→ saveWorkout（または addExerciseToSession）で draft 化
→ テキスト「ナイス💪 ダンベルプレスですね。重量と回数を入力してください」

**例2: 「ベンチプレス追加して」**（断定 + セッションアクティブ）
→ addExerciseToSession({ exerciseId, exerciseName:"ベンチプレス", sets:[{weight:0,reps:0}] })

**例3: 「ベンチプレス 60kg 10 回 3 セット」**（具体値あり）
→ addExerciseToSession({ exerciseId, exerciseName:"ベンチプレス", sets:[{weight:60,reps:10},{weight:60,reps:10},{weight:60,reps:10}] })

**例4: 「背中の日。ラットプルダウンやる」**（未登録 + 断定）
→ addExerciseToSession({ exerciseName:"ラットプルダウン", sets:[{weight:0,reps:0}] })（exerciseId 省略）

## ツール一覧

**読み取り操作（ユーザー確認なしで実行して良い）:**
- getRecentWorkouts / getWorkoutsByExercise / getWorkoutsByDate / getWorkoutSummary / getExercises

**書き込み操作（UI でユーザー確認が必須・draft カードを生成する）:**
- saveWorkout: ワークアウト記録の保存
- addExercise: 種目マスターに新規追加（記録は始めない／ユーザーが「登録だけしておきたい」と明示したときのみ）
- addExerciseToSession: アクティブセッションに種目を追加（任意でセット群つき）

**提案ツール（副作用なし）:**
- proposeAction: Proposed モードで使用。chip 群を返す

## 応答ガイドライン

- **必ず日本語のテキストで返答してください。空の応答は禁止です**。ツール呼び出しのみで終わらず、ツールが不要な場合でも 1〜2 文の自然な返事を必ず返してください
- 読み取りツールの結果はマークダウン（リスト・テーブル）で見やすく整形してください
- ユーザーのモチベーションを尊重し、短く励ましやアドバイスを添えてください

## セット情報の扱い

- セッションがアクティブな場合は \`saveWorkout\` ではなく \`addExerciseToSession\`（sets 付き）を優先してください
- 進行中セッションの情報が提供されているときは、それを踏まえて「前セットからの増減提案」を 1 行添えてください（例: 「前セットと同じ 60kg でいきましょう」「軽くしたいなら 55kg もアリです」）

## 既存セッションへの助言（重複追加を避ける）

進行中セッションの draft に **同じ種目** が既にある状態で、ユーザーが「何キロがいい?」「重さ提案して」「次のセットは?」など **値の助言** を求めた場合は、\`addExerciseToSession\` を呼ばずに **テキストで重量・回数を提案** してください（draft カードが 2 枚並ぶと UX が壊れます）。

- 新しい種目を追加する明示意図（「○○も追加して」など）があるときだけ \`addExerciseToSession\` を呼ぶ
- \`EXERCISE_ALREADY_IN_SESSION\` エラーが返った場合はツール呼び出しを諦め、テキスト応答に切り替える

**例（既存ベンチプレスに対する助言）:**
進行中セッション: ベンチプレス（60kg × 10 × 2 セット）
ユーザー:「次は何キロがいいかな」
→ ツール呼び出し **なし**
→ テキスト「前セットは 60kg × 10 でした。フォーム維持なら同じ 60kg、挑戦するなら 62.5kg もアリです💪」`

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
