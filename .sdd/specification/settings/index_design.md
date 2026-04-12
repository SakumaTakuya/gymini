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
| APIKeySection | 🟢 実装済み | APIキー管理セクションUI |
| ExerciseMasterSection | 🟢 実装済み | 種目マスター管理セクションUI（検索・追加・編集・削除のインライン編集対応） |
| settingsStore | 🟢 実装済み | api-key モジュールで先行実装済み |
| ExerciseRow | 🟢 実装済み | 種目一覧の1行コンポーネント |

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
| APIKeySection | APIキー入力・マスク切替・ステータス・削除のUI | settingsStore | `src/components/settings/APIKeySection.tsx` |
| ExerciseMasterSection | 種目検索・一覧・追加・編集・削除のUI | ExerciseRepository | `src/components/settings/ExerciseMasterSection.tsx` |
| ExerciseRow | 種目一覧の1行。名前 + 編集ボタン | なし（props） | `src/components/settings/ExerciseRow.tsx` |

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

const STORAGE_KEY = 'gymini:api-key'

const useSettingsStore = create<SettingsState & SettingsActions>()((set) => ({
  apiKey: '',
  hasApiKey: false,

  setApiKey: (key: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, key)
      set({ apiKey: key, hasApiKey: key !== '' })
    } catch {
      // T-002: localStorage アクセスエラー時は状態のみ更新
      set({ apiKey: key, hasApiKey: key !== '' })
    }
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

// セクションカード: bg-white rounded-2xl p-4 shadow-sm border border-zinc-100
// セクションラベル: "Gemini API" text-sm font-outfit font-bold text-zinc-500 mb-3
//
// 入力フィールド:
//   type: password (default) / text (visible)
//   bg-zinc-100 rounded-xl px-4 h-12 text-sm font-inter
//   右端に目アイコン（PhEye / PhEyeSlash）ボタン
//
// ステータス行:
//   接続済み: 🟢 text-emerald-600 text-sm
//   未設定: text-zinc-400 text-sm
//   右端に削除ボタン（PhTrash, text-red-500）
//
// タップターゲット: 全ボタン min-h-[44px] min-w-[44px]

// -------------------------------------------------------
// ExerciseMasterSection (src/components/settings/ExerciseMasterSection.tsx)
// -------------------------------------------------------

// セクションカード: bg-white rounded-2xl p-4 shadow-sm border border-zinc-100
// セクションラベル: "種目マスター" text-sm font-outfit font-bold text-zinc-500 mb-3
//
// 検索フィールド:
//   PhMagnifyingGlass アイコン + input
//   bg-zinc-100 rounded-xl px-4 h-12 text-sm font-inter
//   placeholder: "種目を検索..."
//
// 種目一覧:
//   ExerciseRow の繰り返し
//   各行: 種目名 (font-inter text-sm) + 編集ボタン (PhPencilSimple)
//   区切り: border-b border-zinc-100
//
// 追加ボタン:
//   PhPlus + "種目を追加" text-sm text-zinc-500
//   h-12 flex items-center gap-2
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
| コンポーネントテスト | ExerciseRow（表示、編集ボタンクリック） | 基本表示 | FR-007 |
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
| 種目編集UI | インライン編集 vs モーダル | インライン編集 | 種目名の変更だけなのでモーダルは不要。行内の入力フィールドで直接編集 |

## 9.2. 未解決の課題

*未解決の課題なし（実装開始可能）*

---

# 10. 変更履歴

## v1.0 (2026-04-11) — 初版

- 設定画面のコンテンツ設計（APIKeySection + ExerciseMasterSection）
- settingsStore（APIキー管理）の設計
- navigation モジュールとの責務分離を明確化
