---
id: "design-workout"
title: "ワークアウト記録管理"
type: "design"
status: "draft"
sdd-phase: "plan"
impl-status: "not-implemented"
created: "2026-03-08"
updated: "2026-04-10"
depends-on: ["spec-workout"]
tags: ["workout", "session", "phase-1", "react", "typescript", "zustand", "localstorage"]
category: "core"
priority: "high"
risk: "high"
---

# ワークアウト記録管理

**関連 Spec:** [index_spec.md](index_spec.md)
**関連 PRD:** [index.md](../../requirement/workout/index.md)

---

# 1. 実装ステータス

**ステータス:** 🔴 未実装（仕様書改訂に伴い再設計）

| モジュール/機能 | ステータス | 備考 |
|-------------|--------|------|
| WorkoutRepository | 🔴 未実装 | Data Layer: localStorage CRUD（TypeScript化） |
| workoutSessionStore (Zustand) | 🔴 未実装 | State Layer: セッション下書き・カード状態・タイマー |
| useWorkoutSession | 🔴 未実装 | Hook Layer: セッション記録ユースケース |
| IdlePage (FRAME1) | 🔴 未実装 | UI Layer: セッション未開始画面 |
| ActiveWorkoutPage (FRAME2) | 🔴 未実装 | UI Layer: セッション記録画面 |
| ExerciseCard | 🔴 未実装 | UI Layer: 種目カード（4状態） |
| CompletedSetRow | 🔴 未実装 | UI Layer: 完了済みセット行 |
| PendingSetRow | 🔴 未実装 | UI Layer: 入力中セット行 |
| SessionTimer | 🔴 未実装 | UI Layer: 経過時間表示 |
| ExerciseSearchField | 🔴 未実装 | UI Layer: 種目検索・追加フィールド |

---

# 2. 設計目標

- **セッションライフサイクル中心**: FRAME1（Idle）→ FRAME2（Active）→ 保存 → FRAME1 のフローを中心とした設計
- **セット記録のスムーズさ**: チェックで完了→自動追加→前セット値自動入力の連続フロー（FR-028, FR-006）
- **種目カードの状態管理**: 4状態の明確な遷移によるUI制御（FR-030）
- **セッション終了時の一括保存**: 記録中はメモリ内の下書き状態を保持し、「終了」タップ時にのみ localStorage に書き込む
- **オフライン動作**: サーバー不要でブラウザ単体で完結（A-002）
- **Phase 3への拡張性**: AIが `WorkoutRepository` のAPIを利用できるよう、ストア外からも呼び出せる純粋関数として設計

---

# 3. 技術スタック

| 領域 | 採用技術 | 選定理由 |
|------|--------|--------|
| UIフレームワーク | React (TSX) | T-001: TypeScript Strict Mode |
| UIコンポーネント | shadcn/ui + Radix UI | A-001: Library-First。一貫したデザインシステム |
| スタイリング | Tailwind CSS ^4 | T-003: Mobile-First UI。ユーティリティクラスで迅速なモバイルUI構築 |
| ルーティング | TanStack Router ^1 | FRAME1/FRAME2 間の遷移。ファイルベース型安全ルーティング |
| 状態管理 | Zustand ^5 | セッション下書き状態の管理。hooks 経由のみ公開 |
| データ永続化 | localStorage (JSON) | B-001: Privacy-by-Design。A-002: Client-Only Architecture |
| バリデーション | Zod ^3 | localStorage 読み取り時のデータ検証（T-002: No Runtime Errors） |
| 日付処理 | ネイティブ Date API | YYYY-MM-DD 形式と ISO 8601 datetime のみ扱うため十分 |

## 3.1. UI デザインシステム

UIコンポーネントのスタイルは PRD のデザインリファレンス（`.sdd/design-system.html`）に従う。

### カラーパレット

| 用途 | 値 | Tailwind クラス |
|:---|:---|:---|
| Primary（ボタン背景） | `#000000` | `bg-black` |
| Accent（終了ボタン・タイマー） | accent色 | `text-accent` |
| Secondary（背景・入力フィールド） | `#F4F4F5` | `bg-zinc-100` |
| Destructive | `#EF4444` | `bg-red-500` |
| テキスト primary | `#000000` | `text-black` |
| テキスト muted | `#71717A` | `text-zinc-500` |
| テキスト placeholder / SetNumber | `#A1A1AA` | `text-zinc-400` |
| 完了済みセット背景 | `#FAFAFA` | `bg-zinc-50` |
| ボーダー | `#E4E4E7` | `border-zinc-200` |

### タイポグラフィ

| フォント | 用途 |
|:---|:---|
| `Outfit` | 見出し・ボタン・ラベル・種目名（font-weight 600/700/800） |
| `Inter` | ボディ・メタ情報・入力値（font-weight 500） |

---

# 4. アーキテクチャ

## 4.1. システム構成図

```mermaid
graph TD
    subgraph "UI Layer"
        IP[IdlePage<br/>FRAME1]
        AWP[ActiveWorkoutPage<br/>FRAME2]
        EC[ExerciseCard]
        CSR[CompletedSetRow]
        PSR[PendingSetRow]
        ST[SessionTimer]
        ESF[ExerciseSearchField]
    end

    subgraph "Hook Layer（ユースケース）"
        HWS[useWorkoutSession]
    end

    subgraph "State Layer（Hook の実装詳細）"
        WSS[workoutSessionStore<br/>Zustand]
    end

    subgraph "Data Layer（純粋関数）"
        WR[WorkoutRepository]
        ER[ExerciseRepository]
        LS[(localStorage)]
    end

    IP --> HWS
    AWP --> HWS
    AWP --> ST
    AWP --> EC
    AWP --> ESF
    EC --> CSR
    EC --> PSR
    HWS --> WSS
    HWS --> ER
    WSS --> WR
    WR --> LS
    ER --> LS
```

UIは Hook Layer だけを知る。State Layer・Data Layer は hooks の実装詳細であり、UI から直接参照しない。

## 4.2. モジュール分割

### Data Layer

| モジュール名 | 責務 | 依存関係 | 配置場所 |
|-----------|------|---------|--------|
| WorkoutRepository | localStorage のCRUD操作。Reactを知らない純粋関数 | workoutSchema (Zod) | `src/lib/workoutRepository.ts` |
| ExerciseRepository | 種目データの読み取り。（exercise-master モジュール提供） | なし | `src/lib/exerciseRepository.ts` |

### Schema Layer

| モジュール名 | 責務 | 依存関係 | 配置場所 |
|-----------|------|---------|--------|
| workoutSchema | Workout/WorkoutExercise/WorkoutSet の Zod スキーマ定義 | dateStringSchema, isoDateTimeSchema (date.ts) | `src/schemas/workout.ts` |

### State Layer（Hook の実装詳細）

| モジュール名 | 責務 | 依存関係 | 配置場所 |
|-----------|------|---------|--------|
| workoutSessionStore | セッション下書き・カード状態・タイマーの状態保持（Zustand）。UI から直接使用しない | WorkoutRepository | `src/stores/workoutSessionStore.ts` |

### Hook Layer（ユースケース）

| モジュール名 | 責務 | 依存関係 | 配置場所 |
|-----------|------|---------|--------|
| useWorkoutSession | セッション記録の全ユースケース。下書き管理・カード状態・タイマー・保存・種目検索を束ねる | workoutSessionStore, ExerciseRepository | `src/hooks/useWorkoutSession.ts` |

### UI Layer

| モジュール名 | 責務 | 依存関係 | 配置場所 |
|-----------|------|---------|--------|
| IdlePage | FRAME1: セッション未開始画面。「トレーニングを始める」ボタン | useWorkoutSession | `src/routes/index.tsx` |
| ActiveWorkoutPage | FRAME2: セッション記録画面。種目カード一覧 + 種目追加 + 終了ボタン | useWorkoutSession | `src/routes/workout.tsx` |
| ExerciseCard | 種目カード（4状態: collapsed/expanded-empty/recording/all-completed） | なし（props） | `src/components/workout/ExerciseCard.tsx` |
| CompletedSetRow | 完了済みセット行（ゴミ箱 + 値表示 + 鉛筆） | なし（props） | `src/components/workout/CompletedSetRow.tsx` |
| PendingSetRow | 入力中セット行（セット番号 + 重量/回数入力 + チェックボタン） | なし（props） | `src/components/workout/PendingSetRow.tsx` |
| SessionTimer | セッション経過時間のリアルタイム表示（pill型） | なし（props: startedAt） | `src/components/workout/SessionTimer.tsx` |
| ExerciseSearchField | 種目検索・追加フィールド | なし（props） | `src/components/workout/ExerciseSearchField.tsx` |

---

# 5. データモデル

```typescript
// localStorage キー
const STORAGE_KEY = 'gymini:workouts'

// -------------------------------------------------------
// 日付・日時スキーマ（src/schemas/date.ts — history モジュールと共有）
// -------------------------------------------------------
import { z } from 'zod'

// DateString: "YYYY-MM-DD" 形式の branded type（history で定義済み）
export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export type DateString = string & { readonly __brand: 'DateString' }

// ISODateTimeString: ISO 8601 datetime の branded type（新規追加）
export const isoDateTimeSchema = z.string().datetime()
export type ISODateTimeString = string & { readonly __brand: 'ISODateTimeString' }

export function toISODateTimeString(value: string): ISODateTimeString {
  isoDateTimeSchema.parse(value)
  return value as ISODateTimeString
}

export function nowISODateTimeString(): ISODateTimeString {
  return new Date().toISOString() as ISODateTimeString
}

// -------------------------------------------------------
// ワークアウト Zod スキーマ（src/schemas/workout.ts）
// -------------------------------------------------------

const workoutSetSchema = z.object({
  weight: z.number().nonnegative(),
  reps: z.number().int().nonnegative(),
})

const workoutExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  sets: z.array(workoutSetSchema),
})

const workoutSchema = z.object({
  id: z.string(),
  date: dateStringSchema,
  exercises: z.array(workoutExerciseSchema),
  startedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

// 保存形式: JSON配列
// [
//   {
//     id: "uuid-v4",
//     date: "2026-03-08",
//     exercises: [
//       {
//         exerciseId: "bench-press",
//         exerciseName: "ベンチプレス",
//         sets: [
//           { weight: 60, reps: 10 },
//           { weight: 65, reps: 8 }
//         ]
//       }
//     ],
//     startedAt: "2026-03-08T10:00:00.000Z",
//     endedAt: "2026-03-08T10:45:00.000Z",
//     createdAt: "2026-03-08T10:45:00.000Z",
//     updatedAt: "2026-03-08T10:45:00.000Z"
//   }
// ]
```

---

# 6. インターフェース定義

```typescript
// -------------------------------------------------------
// WorkoutRepository (src/lib/workoutRepository.ts)
// 純粋関数群。localStorage を直接読み書きする。
// -------------------------------------------------------

// [internal] getAll は listByDateDesc/listByDate の内部ヘルパー。公開APIではない。
function getAll(): Workout[] {
  // localStorage から全ワークアウトを返す。
  // Zod でパース、失敗時は [] にフォールバック（T-002）
}

function getById(id: string): Workout | undefined {
  // IDでワークアウトを取得する
}

function listByDateDesc(): Workout[] {
  // 日付降順でソートして返す。ワークアウトが存在しない場合は []
}

function listByDate(date: DateString): Workout[] {
  // 指定日のワークアウトを返す。該当なしの場合は []
}

type WorkoutInput = Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>

function save(input: WorkoutInput): Workout {
  // id, createdAt, updatedAt を付与して保存（FR-001, FR-031）
}

function remove(id: string): void {
  // 指定IDを削除（`delete` はJS予約語のため `remove` を使用）
}

// -------------------------------------------------------
// workoutSessionStore (src/stores/workoutSessionStore.ts)
// Hook の実装詳細。UI から直接 import しない。
// -------------------------------------------------------

type WorkoutSessionState = {
  // State
  isActive: boolean                       // セッション中かどうか
  startedAt: ISODateTimeString | null     // セッション開始時刻
  draftExercises: DraftExercise[] // セッション中の種目・セット

  // Actions（spec WorkoutSession API に対応）
  startSession: () => void
  // startSession: isActive = true, startedAt = nowISODateTimeString(), draftExercises = []

  endSession: () => void
  // endSession: draftExercises → WorkoutInput に変換 → WorkoutRepository.save
  // 完了後 isActive = false, startedAt = null, draftExercises = [] にリセット

  addExercise: (exercise: { exerciseId: string; exerciseName: string }) => void
  // 種目カードを expanded-empty 状態で追加（FR-005, FR-030）

  addFirstSet: (exerciseIndex: number) => void
  // 「+」ボタン: pendingSet を { weight: 0, reps: 0 } で初期化、cardState → recording（FR-028）

  completeSet: (exerciseIndex: number, set: WorkoutSet) => void
  // チェックボタン: pendingSet → sets[] に追加、次の pendingSet を前セット値で初期化（FR-028, FR-006）
  // 呼び出し側が入力行なし→cardState: all-completed に遷移するかを判定

  editCompletedSet: (exerciseIndex: number, setIndex: number) => void
  // 鉛筆: sets[setIndex] を pendingSet に移動、cardState → recording（FR-029）

  deleteCompletedSet: (exerciseIndex: number, setIndex: number) => void
  // ゴミ箱: sets[setIndex] を削除（FR-029）

  toggleExerciseCard: (exerciseIndex: number) => void
  // カードヘッダータップ: collapsed ↔ 元の状態 を切り替え（FR-030）
}

// DraftExercise: セッション記録中の1種目（未保存）
type DraftExercise = {
  exerciseId: string
  exerciseName: string
  sets: WorkoutSet[]              // 完了済みセット
  pendingSet: WorkoutSet | null   // 入力中セット。null = 入力行なし
  cardState: ExerciseCardState    // 4状態（FR-030）
}

// -------------------------------------------------------
// useWorkoutSession (src/hooks/useWorkoutSession.ts)
// セッション記録のユースケース。UI はこれだけ知ればよい。
// -------------------------------------------------------

function useWorkoutSession() {
  // return: {
  //   // State
  //   isActive: boolean,
  //   startedAt: ISODateTimeString | null,
  //   draftExercises: DraftExercise[],
  //   elapsedSeconds: number,              // spec の getElapsedTime(): number を React hooks パターンでリアクティブ state として実現（FR-032）
  //
  //   // Session lifecycle（FR-001, FR-031）
  //   startSession: () => void,
  //   endSession: () => void,
  //
  //   // Exercise management（FR-005）
  //   addExercise: (exercise: { exerciseId: string; exerciseName: string }) => void,
  //   searchExercises: (query: string) => Exercise[],  // ExerciseRepository を内部で呼ぶ
  //
  //   // Set management（FR-028, FR-006, FR-029）
  //   addFirstSet: (exerciseIndex: number) => void,
  //   completeSet: (exerciseIndex: number, set: WorkoutSet) => void,
  //   editCompletedSet: (exerciseIndex: number, setIndex: number) => void,
  //   deleteCompletedSet: (exerciseIndex: number, setIndex: number) => void,
  //
  //   // Card state（FR-030）
  //   toggleExerciseCard: (exerciseIndex: number) => void,
  // }
}
```

---

# 7. 非機能要件実現方針

| 要件 | 実現方針 |
|------|--------|
| データ整合性（NFR-001） | localStorage への書き込みは `try/catch` でラップ。読み取り時は Zod パースで検証し、失敗時は空配列にフォールバック（T-002） |

### セット完了→自動追加の実現方針（FR-028, FR-006）

`ExerciseCard` 内の `PendingSetRow` でチェックボタンタップ時の挙動：

```
1. pendingSet の値（重量・回数）を completeSet に渡す
2. store が pendingSet → sets[] に追加
3. 次の pendingSet を直前の確定セットの { weight, reps } でコピー初期化
4. PendingSetRow が再レンダリングされ、前セット値が入力欄に表示される
```

### 種目カード状態遷移の実現方針（FR-030）

`DraftExercise.cardState` を Zustand store で管理し、以下のルールで遷移する：

| トリガー | 遷移元 | 遷移先 | アクション |
|:--------|:-------|:-------|:---------|
| 種目追加 | - | `expanded-empty` | `addExercise` |
| 「+」ボタン | `expanded-empty` / `all-completed` | `recording` | `addFirstSet` |
| チェック | `recording` | `recording` | `completeSet`（次の pendingSet を設定） |
| 最後のセット完了 | `recording` | `all-completed` | `completeSet` 後に pendingSet が null の場合 |
| ヘッダータップ | 任意 | `collapsed` / 元の状態 | `toggleExerciseCard` |

### セッションタイマーの実現方針（FR-032）

`useWorkoutSession` 内で `startedAt` を基に `elapsedSeconds` を毎秒更新する：

```typescript
// useWorkoutSession 内
const [elapsedSeconds, setElapsedSeconds] = useState(0)

useEffect(() => {
  if (!startedAt) return
  const interval = setInterval(() => {
    setElapsedSeconds(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
  }, 1000)
  return () => clearInterval(interval)
}, [startedAt])
```

`SessionTimer` コンポーネントが `elapsedSeconds` を `HH:MM:SS` 形式で表示する。

---

# 8. テスト戦略

| テストレベル | 対象 | カバレッジ目標 | 対応FR |
|-----------|------|------------|--------|
| ユニットテスト | WorkoutRepository（save, remove, getById, listByDateDesc, listByDate） | 全関数 | FR-001 |
| ユニットテスト | workoutSchema（Zod パースの正常系・異常系） | 全パターン | T-002 |
| ユニットテスト | useWorkoutSession（startSession, endSession, addExercise, completeSet, editCompletedSet, deleteCompletedSet, addFirstSet, toggleExerciseCard） | 全アクション | FR-001〜FR-032 |
| コンポーネントテスト | PendingSetRow（チェック→完了、前セット値表示） | 主要インタラクション | FR-028, FR-006 |
| コンポーネントテスト | CompletedSetRow（ゴミ箱→削除、鉛筆→編集戻し） | 主要インタラクション | FR-029 |
| コンポーネントテスト | ExerciseCard（4状態遷移、折りたたみ/展開） | 主要インタラクション | FR-030 |
| コンポーネントテスト | SessionTimer（経過時間表示） | 表示フォーマット検証 | FR-032 |
| 統合テスト | ActiveWorkoutPage（複数種目セッション→終了→保存） | FR-005 完全フロー | FR-005 |
| E2Eテスト | FRAME1 → FRAME2 → セット記録 → 終了 → FRAME1 | セッションライフサイクル全体 | FR-001, FR-031 |

---

# 9. 設計判断

## 9.1. 決定事項

| 決定事項 | 選択肢 | 決定内容 | 理由 |
|---------|--------|--------|------|
| 永続化方法 | localStorage vs IndexedDB | localStorage | DC_003準拠。ワークアウトデータは数百件程度の想定でlocalStorageで十分。実装コストが低い |
| 状態管理 | Zustand vs useState vs Context | Zustand | FRAME1/FRAME2 をまたぐセッション状態の共有が必要。useState では prop drilling が発生する |
| IDの生成 | crypto.randomUUID() | crypto.randomUUID() | モダンブラウザで標準サポート。外部依存ゼロ |
| exerciseNameのスナップショット保存 | IDのみ保存 vs 名前も保存 | 両方保存 | 種目名変更後も記録の表示が崩れない。AIが参照する際も名前があると有利 |
| 日付形式 | Date オブジェクト vs 文字列 | 文字列（YYYY-MM-DD） | localStorage にそのまま保存可能。ソート・比較が文字列比較で可能 |
| 削除済み種目の表示 | exerciseId 存在確認 vs exerciseName フォールバック | フォールバック表示（存在確認なし） | 種目マスターが削除されても記録の表示が壊れない（spec 制約事項参照） |
| 記録中の下書き管理 | 都度保存 vs セッション終了時に一括保存 | セッション終了時に一括保存 | 種目追加のたびに保存すると不完全なデータが残る。「終了」タップ時にのみ localStorage に書き込む（FR-031） |
| 自動入力の対象フィールド | 重量・回数 | 重量・回数のみ | 重量・回数は同じセットを繰り返すケースが多い（FR-006） |
| レイヤー構成 | Repository を UI から直接呼ぶ vs Hook Layer を挟む | Hook Layer（usecase hooks）を挟む | UI が Zustand・Repository を直接知ると、状態管理ライブラリ変更時の影響範囲が広い。hooks を境界にすることで UI は「何ができるか」だけ知ればよい |
| Zustand store の公開範囲 | UI から直接 useStore() vs hooks 経由のみ | hooks 経由のみ | store は hooks から利用される実装詳細。直接公開するとユースケースの境界が曖昧になる |
| カード状態の管理場所 | コンポーネントローカル state vs Zustand store | Zustand store | 折りたたみ状態はセッション全体で管理が必要。ローカル state だとリレンダリング時にリセットされる |
| タイマーの更新方式 | setInterval vs requestAnimationFrame | setInterval（1秒間隔） | 秒単位の表示で十分。requestAnimationFrame はオーバースペック |
| FRAME1/FRAME2 の画面遷移 | TanStack Router ルート | ルートベースの遷移 | FRAME1（`/`）→ FRAME2（`/workout`）。TanStack Router の型安全なナビゲーション |
| localStorage 読み取り検証 | 型アサーション vs Zod パース | Zod パース | T-002: No Runtime Errors。不正データによるクラッシュを防止 |
| 日付・日時の型表現 | 素の `string` vs Zod branded type | Zod branded type（`DateString`, `ISODateTimeString`） | history モジュールと同じパターン。素の `string` では任意の文字列が型チェックを通過する。branded type は境界でパースし内部は型安全に流通でき、Zod 活用方針に合致。`src/schemas/date.ts` で history と共有 |

## 9.2. 未解決の課題

> **注意**: このセクションに内容がある場合は `impl-status: "blocked"` にセットし、解決するまで実装を開始しないこと（D-002）。

*現時点で未解決の課題はありません。*
