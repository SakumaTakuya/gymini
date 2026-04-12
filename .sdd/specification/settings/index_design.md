---
id: "design-settings"
title: "設定画面"
type: "design"
status: "approved"
sdd-phase: "plan"
impl-status: "implemented"
created: "2026-04-11"
updated: "2026-04-12"
depends-on: ["spec-settings", "design-exercise-master", "design-api-key"]
tags: ["settings", "phase-2"]
category: "view"
priority: "medium"
risk: "low"
---

# 設定画面

**関連 Spec:** [index_spec.md](index_spec.md)
**関連 PRD:** [index.md](../../requirement/settings/index.md)

---

# 1. 実装ステータス

**ステータス:** 🟢 実装済み

| モジュール/機能 | ステータス | 備考 |
|-------------|--------|------|
| SettingsContent | 🟢 実装済み | 設定画面コンテンツ統合コンポーネント |
| APIKeySection | 🟢 実装済み | APIキー管理セクションUI（空文字入力時は deleteApiKey に分岐） |
| ExerciseMasterSection | 🟢 実装済み | 種目マスター管理セクションUI（検索・追加・編集・削除のインライン編集対応） |
| settingsStore | 🟢 実装済み | api-key モジュールで先行実装済み（空文字 setApiKey は throw） |
| ExerciseRow | 🟢 実装済み | 種目一覧の1行コンポーネント（編集・削除ボタン） |
| SectionCard | 🟢 実装済み | FRAME5 セクションカードスタイルのラッパー（shadcn Card ベース） |

---

# 2. 設計目標

- **コンテンツ専念**: 設定画面のルーティング・レイアウト（Xボタン、BottomNav非表示）は navigation が実装済み。本モジュールはコンテンツ部分のみに集中する
- **ドメイン委譲**: APIキーと種目マスターのビジネスロジックは各専用モジュール（settingsStore, ExerciseRepository）に委譲し、UI統合のみ担当
- **design-system.html 準拠**: FRAME5 のデザインリファレンスに忠実なスタイリング
- **Privacy-by-Design**: APIキーは localStorage のみに保存（B-001）
- **TypeScript strict mode**: 全コンポーネントで型安全性を確保（T-001）

---

# 3. 技術スタック

| 領域 | 採用技術 | 選定理由 |
|------|--------|--------|
| 言語 | TypeScript（.tsx） | T-001準拠 |
| UIフレームワーク | React | CONSTITUTION 技術スタック |
| スタイリング | Tailwind CSS ^4 | design-system.html 準拠 |
| アイコン | @phosphor-icons/react | PhGear, PhEye, PhEyeSlash, PhPencilSimple, PhPlus, PhTrash 等 |
| 状態管理 | Zustand ^5 | settingsStore（APIキー永続化） |
| データ永続化 | localStorage | B-001: Privacy-by-Design |

---

# 4. アーキテクチャ

## 4.1. システム構成図

```mermaid
graph TD
    subgraph "Route Layer（navigation が管理）"
        SP["settings.tsx<br/>/settings ルート（layout外）"]
    end

    subgraph "UI Layer（本モジュール）"
        SC[SettingsContent]
        AKS[APIKeySection]
        EMS[ExerciseMasterSection]
        ER_UI[ExerciseRow]
    end

    subgraph "State Layer"
        SS[settingsStore<br/>Zustand]
    end

    subgraph "Data Layer"
        ExR[ExerciseRepository]
        LS[(localStorage)]
    end

    SP --> SC
    SC --> AKS
    SC --> EMS
    EMS --> ER_UI
    AKS --> SS
    EMS --> ExR
    SS --> LS
    ExR --> LS
```

## 4.2. モジュール分割

### UI Layer

| モジュール名 | 責務 | 依存関係 | 配置場所 |
|-----------|------|---------|--------|
| SettingsContent | 設定画面コンテンツ統合。タイトル + APIKeySection + ExerciseMasterSection | なし（子コンポーネントを配置） | `src/components/settings/SettingsContent.tsx` |
| APIKeySection | APIキー入力・マスク切替・ステータス・削除のUI | settingsStore, SectionCard | `src/components/settings/APIKeySection.tsx` |
| ExerciseMasterSection | 種目検索・一覧・追加・編集・削除のUI | ExerciseRepository, SectionCard, ExerciseRow | `src/components/settings/ExerciseMasterSection.tsx` |
| ExerciseRow | 種目一覧の1行。名前 + 編集ボタン + 削除ボタン | なし（props） | `src/components/settings/ExerciseRow.tsx` |
| SectionCard | FRAME5 のセクションカードスタイル（`bg-white rounded-2xl p-4 shadow-sm border`）を適用する薄いラッパー。shadcn `<Card>` をベース | shadcn Card | `src/components/settings/SectionCard.tsx` |

### State Layer

| モジュール名 | 責務 | 依存関係 | 配置場所 |
|-----------|------|---------|--------|
| settingsStore | APIキーの保存・削除・取得。`hasApiKey` フラグ。Zustand + localStorage 直接操作 | なし | `src/stores/settingsStore.ts` |

> **Note**: settingsStore は navigation の GearIcon からも参照される（`hasApiKey` でバッジ表示判定）。

### Data Layer（外部モジュール）

| モジュール名 | 責務 | 提供元 | 配置場所 |
|-----------|------|--------|--------|
| ExerciseRepository | 種目CRUDの永続化 | exercise-master モジュール | `src/lib/exerciseRepository.ts` |

### 既存モジュールの変更

| モジュール名 | 変更内容 | 配置場所 |
|-----------|---------|--------|
| SettingsPage (navigation) | SettingsContent を children / 内部コンポーネントとして配置 | `src/pages/SettingsPage.tsx` |

---

# 5. データモデル

```typescript
// settingsStore の状態
// localStorage キー: 'gymini:api-key'

type SettingsState = {
  apiKey: string          // APIキー文字列（空文字 = 未設定）
  hasApiKey: boolean      // apiKey !== '' の派生値
}

type SettingsActions = {
  setApiKey: (key: string) => void    // localStorage に保存
  deleteApiKey: () => void            // localStorage から削除
  loadApiKey: () => void              // localStorage から読み込み（初期化時）
}
```

---

# 6. インターフェース定義

```typescript
// -------------------------------------------------------
// settingsStore (src/stores/settingsStore.ts)
// -------------------------------------------------------
// ※ settingsStore の詳細仕様は api-key モジュールを参照:
//   .sdd/specification/api-key/index_design.md §6
//
// 要点:
//   - setApiKey(key): 空文字列を渡すと Error を throw。削除には deleteApiKey() を使用
//   - deleteApiKey(): localStorage 削除 + ストア状態リセット
//   - loadApiKey(): アプリ起動時にルートレイアウトで呼び出し（__root.tsx）

const STORAGE_KEY = 'gymini:api-key'

const useSettingsStore = create<SettingsState & SettingsActions>()((set) => ({
  apiKey: '',
  hasApiKey: false,

  setApiKey: (key: string) => {
    if (key === '') {
      throw new Error(
        '空文字列は setApiKey に渡せません。削除には deleteApiKey() を使用してください。',
      )
    }
    try {
      localStorage.setItem(STORAGE_KEY, key)
    } catch {
      // T-002: localStorage 書き込み失敗時も状態は更新する
    }
    set({ apiKey: key, hasApiKey: true })
  },

  deleteApiKey: () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // T-002: エラー時も状態をリセット
    }
    set({ apiKey: '', hasApiKey: false })
  },

  loadApiKey: () => {
    try {
      const key = localStorage.getItem(STORAGE_KEY) ?? ''
      set({ apiKey: key, hasApiKey: key !== '' })
    } catch {
      // T-002: localStorage 読み取り失敗時はデフォルト
      set({ apiKey: '', hasApiKey: false })
    }
  },
}))

// -------------------------------------------------------
// SettingsContent (src/components/settings/SettingsContent.tsx)
// -------------------------------------------------------

// Props: なし（内部で各セクションを配置）
// レイアウト: px-4 pt-20 pb-8 space-y-6
// タイトル: "設定" text-2xl font-outfit font-bold

// -------------------------------------------------------
// APIKeySection (src/components/settings/APIKeySection.tsx)
// -------------------------------------------------------

// コンテナ: <SectionCard>（FRAME5 のセクションカードスタイルを内包）
// セクションラベル: "Gemini API" text-sm font-outfit font-bold text-zinc-500 mb-3
//
// 入力フィールド:
//   type: password (default) / text (visible)
//   bg-zinc-100 rounded-xl px-4 h-12 text-sm font-inter
//   右端に目アイコン（PhEye / PhEyeSlash）ボタン
//
// onChange ハンドラの挙動:
//   - 入力値が空文字列の場合 → settingsStore.deleteApiKey() を呼ぶ
//   - それ以外の場合 → settingsStore.setApiKey(value) を呼ぶ
//   理由: setApiKey は空文字列を受け付けず throw するため、空文字検出時は
//        削除経路に分岐する必要がある
//
// ステータス行:
//   接続済み: 🟢 text-emerald-600 text-sm
//   未設定: text-zinc-400 text-sm
//   右端に削除ボタン（PhTrash, text-red-500）。hasApiKey が true の時のみ表示
//
// タップターゲット: 全ボタン min-h-[44px] min-w-[44px]

// -------------------------------------------------------
// ExerciseMasterSection (src/components/settings/ExerciseMasterSection.tsx)
// -------------------------------------------------------

// コンテナ: <SectionCard>
// セクションラベル: "種目マスター" text-sm font-outfit font-bold text-zinc-500 mb-3
//
// 検索フィールド:
//   PhMagnifyingGlass アイコン + input
//   bg-zinc-100 rounded-xl pl-10 pr-4 h-12 text-sm font-inter
//   placeholder: "種目を検索..."
//
// 種目一覧:
//   通常行は <ExerciseRow>（名前 + 編集 PhPencilSimple + 削除 PhTrash）
//   編集中の行はインラインフォーム（下記）に差し替わる
//   区切り: border-b border-zinc-100
//
// 追加ボタン（初期状態）:
//   PhPlus + "種目を追加" text-sm text-zinc-500
//   h-12 flex items-center gap-2
//
// インライン追加/編集フォーム:
//   - 追加: 「種目を追加」タップで、同じ場所に入力フィールド + PhCheck + PhX を展開
//   - 編集: ExerciseRow の編集ボタンで、対象行を同じ入力 + PhCheck + PhX に差し替え
//   - 入力: bg-zinc-100 rounded-xl px-3 h-10 text-sm font-inter, autoFocus
//   - PhCheck（text-emerald-600）: 確定 → exerciseRepository.create/update → 一覧再読込
//   - PhX（text-zinc-500）: キャンセル → フォーム閉じる
//   - 空文字確定はキャンセル扱い
//   - 重複名・不正値は exerciseRepository が throw → UI では catch してサイレント無視
//
// 削除:
//   ExerciseRow の削除ボタン → exerciseRepository.remove(id) → 一覧再読込
//
// タップターゲット: 全ボタン min-h-[44px] min-w-[44px]
```

---

# 7. 非機能要件実現方針

| 要件 | 実現方針 |
|------|--------|
| セキュリティ（NFR-001）: APIキーの保護 | settingsStore が localStorage のみで永続化。外部通信なし。`type="password"` でデフォルトマスク |
| 操作性（NFR-002）: 検索のリアルタイム更新 | `useState` で検索クエリを管理し、`onChange` のたびに ExerciseRepository.search() を呼び出し。デバウンスなし（ローカルデータのため即時フィルタ可能） |

---

# 8. テスト戦略

| テストレベル | 対象 | カバレッジ目標 | 対応FR |
|-----------|------|------------|--------|
| ユニットテスト | settingsStore（setApiKey, deleteApiKey, loadApiKey, hasApiKey 派生） | 全操作 | FR-004, FR-006 |
| コンポーネントテスト | APIKeySection（入力、マスク切替、削除、ステータス表示） | 主要インタラクション | FR-003, FR-004, FR-005, FR-006 |
| コンポーネントテスト | ExerciseMasterSection（検索、一覧表示、追加、編集、削除） | 主要インタラクション | FR-007, FR-008, FR-009 |
| コンポーネントテスト | ExerciseRow（表示、編集ボタンクリック、削除ボタンクリック） | 基本表示 | FR-007 |
| コンポーネントテスト | SectionCard（FRAME5 クラスの適用、className マージ） | スタイル適用 | FR-003, FR-007 |
| 統合テスト | SettingsContent（APIKeySection + ExerciseMasterSection の統合表示） | 画面統合 | FR-003, FR-007 |
| E2Eテスト | 歯車アイコン → 設定画面 → APIキー入力 → 種目追加 → Xボタンで戻る | 全体フロー | FR-001〜FR-009 |

---

# 9. 設計判断

## 9.1. 決定事項

| 決定事項 | 選択肢 | 決定内容 | 理由 |
|---------|--------|--------|------|
| settingsStore のアーキテクチャ | Zustand persist vs 直接 localStorage | 直接 localStorage 操作 | APIキーは単純な文字列1つであり persist ミドルウェアはオーバースペック。`setItem` / `getItem` / `removeItem` で十分 |
| APIキーの保存タイミング | onChange 即保存 vs 保存ボタン | onChange 即保存 | 入力フィールドの変更時に自動保存。ユーザーが保存ボタンを探す手間を省く。削除は明示的ボタン |
| 設定画面の構造 | 単一コンポーネント vs セクション分割 | セクション分割（APIKeySection + ExerciseMasterSection） | ドメインごとに独立。テスタビリティ向上。将来のセクション追加が容易 |
| 種目検索のデバウンス | あり vs なし | なし | localStorage からの読み取りは十分高速。デバウンスは不要な複雑さ |
| APIキー接続テスト | 設定時に実行 vs スキップ | スキップ（Phase 3 で実装） | Gemini API への接続テストは AIチャット機能のスコープ。設定画面は保存のみ |
| 種目編集UI | インライン編集 vs モーダル | インライン編集 | 種目名の変更だけなのでモーダルは不要。行内の入力フィールドで直接編集。確定は PhCheck、キャンセルは PhX ボタン |
| 空文字 setApiKey の扱い | ストア内で無視（旧方針） vs throw（現行） | throw（api-key 設計に追随） | 削除意図と空文字保存を明確に区別するため。APIKeySection の onChange ハンドラで空文字検出時は `deleteApiKey()` に分岐 |
| セクションカードの共通化 | 各セクションでクラス直書き vs 共通コンポーネント | 共通 `<SectionCard>` | FRAME5 のカードスタイルが 2 箇所以上で使われるため、shadcn `<Card>` をラップして一元化。将来のセクション追加にも対応 |

## 9.2. 未解決の課題

*未解決の課題なし（実装開始可能）*

---

# 10. 変更履歴

## v1.1 (2026-04-12) — 実装反映

- `settingsStore.setApiKey` の挙動を実装（api-key 設計）に追随: 空文字列は throw
- APIKeySection の onChange 挙動を明記（空文字入力時は `deleteApiKey()` に分岐）
- ExerciseMasterSection のインライン追加/編集フォームの UI 仕様を追記
- `SectionCard` をモジュールに追加（FRAME5 カードスタイルの共通コンポーネント）
- 9.1 決定事項に「空文字 setApiKey の扱い」「セクションカードの共通化」を追加

## v1.0 (2026-04-11) — 初版

- 設定画面のコンテンツ設計（APIKeySection + ExerciseMasterSection）
- settingsStore（APIキー管理）の設計
- navigation モジュールとの責務分離を明確化
