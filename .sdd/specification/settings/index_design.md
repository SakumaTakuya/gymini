---
id: "design-settings"
title: "設定画面"
type: "design"
status: "approved"
sdd-phase: "plan"
impl-status: "implemented"
created: "2026-04-11"
updated: "2026-04-18"
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
| settingsStore | 🟢 実装済み | api-key モジュールで実装済み（空文字 setApiKey は内部で deleteApiKey と同等に扱う） |
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

    subgraph "Hook Layer（外部モジュール経由）"
        UEX[useExercises<br/>hook]
    end

    subgraph "State Layer"
        SS[settingsStore<br/>Zustand]
        ES[exerciseStore<br/>Zustand]
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
    EMS --> UEX
    UEX --> ES
    ES --> ExR
    SS --> LS
    ExR --> LS
```

## 4.2. モジュール分割

### UI Layer

| モジュール名 | 責務 | 依存関係 | 配置場所 |
|-----------|------|---------|--------|
| SettingsContent | 設定画面コンテンツ統合。APIKeySection + ExerciseMasterSection（画面内タイトルなし・FRAME5 準拠） | なし（子コンポーネントを配置） | `src/components/settings/SettingsContent.tsx` |
| APIKeySection | APIキー入力・マスク切替・ステータス・削除のUI。debounce + saveStatus の可視フィードバック | settingsStore, SectionCard | `src/components/settings/APIKeySection.tsx` |
| ExerciseMasterSection | 種目検索・一覧・追加・編集・削除のUI | useExercises (hook), SectionCard, ExerciseRow | `src/components/settings/ExerciseMasterSection.tsx` |
| ExerciseRow | 種目一覧の1行。名前 + 編集ボタンのみ（design-system.html FRAME5 準拠。削除は編集モード時のインラインフォーム内で提供） | なし（props） | `src/components/settings/ExerciseRow.tsx` |
| SectionCard | FRAME5 のセクションカード（`bg-white rounded-[20px] shadow-soft border border-gym-zinc-100 overflow-hidden`）を適用する薄いラッパー。shadcn `<Card>` をベース。`label` prop はカード外側に `text-[10px] font-bold text-gym-zinc-400 uppercase tracking-widest` で描画 | shadcn Card | `src/components/settings/SectionCard.tsx` |

### Hook Layer（外部モジュール）

| モジュール名 | 責務 | 提供元 | 配置場所 |
|-----------|------|--------|--------|
| useExercises | 種目マスターの公開 hook。`{ exercises, search, create, update, remove }` を提供。内部で exerciseStore を subscribe し、他タブの localStorage 変更にも追従 | exercise-master モジュール | `src/hooks/useExercises.ts` |

> **Note**: UI（ExerciseMasterSection）は `ExerciseRepository` を直接 import せず、`useExercises()` 経由でのみアクセスする（UI→Hook→Store→Repository の一貫性を確保）。

### State Layer

| モジュール名 | 責務 | 依存関係 | 配置場所 |
|-----------|------|---------|--------|
| settingsStore | APIキーの保存・削除・取得。`hasApiKey` フラグ。Zustand + localStorage 直接操作 | なし | `src/stores/settingsStore.ts` |

> **Note**: settingsStore は navigation の GearIcon からも参照される（`hasApiKey` でバッジ表示判定）。

### Data Layer（外部モジュール）

| モジュール名 | 責務 | 提供元 | 配置場所 |
|-----------|------|--------|--------|
| ExerciseRepository | 種目CRUDの永続化。**UI から直接 import してはならない**（`useExercises` 経由のみ） | exercise-master モジュール | `src/lib/exerciseRepository.ts` |

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
//   - setApiKey(key): 通常は保存。空文字列が渡された場合は内部で deleteApiKey と同等（状態リセット + localStorage.removeItem）
//   - deleteApiKey(): localStorage 削除 + ストア状態リセット（明示的削除用の API）
//   - loadApiKey(): アプリ起動時にルートレイアウトで呼び出し（__root.tsx）

const STORAGE_KEY = 'gymini:api-key'

const useSettingsStore = create<SettingsState & SettingsActions>()((set) => ({
  apiKey: '',
  hasApiKey: false,

  setApiKey: (key: string) => {
    // v1.2: 空文字列は「削除」として扱う（UI 層からの空文字 onChange を許容）
    if (key === '') {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // T-002: localStorage 削除失敗時も状態はリセットする
      }
      set({ apiKey: '', hasApiKey: false })
      return
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
// レイアウト: pt-16 pb-12 px-4 space-y-6（design-system.html FRAME5 準拠）
// タイトル表示なし: FRAME5 は右上の閉じる X ボタン（navigation の SettingsPage が提供）のみで、
//                  設定画面内部にはタイトルヘッダを置かない

// -------------------------------------------------------
// APIKeySection (src/components/settings/APIKeySection.tsx)
// -------------------------------------------------------

// コンテナ: <SectionCard label="Gemini API">（ラベルはカード外側 text-[10px] uppercase tracking-widest）
//
// 入力フィールド:
//   type: password (default) / text (visible)
//   bg-gym-zinc-100 rounded-xl px-4 h-11 border border-gym-zinc-200（design-system.html FRAME5 準拠）
//   右端に目アイコン（PhEye / PhEyeSlash）ボタン
//
// onChange ハンドラの挙動（debounce ベース、v1.3 追加）:
//   - ローカル state（localValue）で入力値を即時反映し UI ブロッキングを防止
//   - 300ms debounce（useRef + setTimeout）後に settingsStore.setApiKey(value) を実行
//   - 保存ステータスを 'idle' → 'saving'（入力中）→ 'saved'（保存完了）→ 'idle'（1500ms 後）で遷移
//   - 'saving' / 'saved' は aria-live="polite" の小テキストで可視フィードバック
//   - 空文字列も setApiKey に渡して良い（store 側で削除扱いされるため UI 側の分岐は不要）
//   - unmount 時に pending な setTimeout は必ず clearTimeout（副作用漏れ防止）
//   - 削除ボタン押下時は pending debounce timer をキャンセルし、localValue をクリアして deleteApiKey() を呼ぶ
//
// 保存ステータスインジケータ:
//   type SaveStatus = 'idle' | 'saving' | 'saved'
//   - 入力中: 「保存中…」を表示（aria-live="polite" でスクリーンリーダー通知）
//   - debounce 完了（300ms 後）: 「保存済み」を表示
//   - 1500ms 後: 非表示（idle）に戻る
//   - min-h-[1em] で高さ固定し、表示切替時のレイアウトシフトを防止
//
// ステータス行（border-t で区切り、セクションカードの下段）:
//   接続済み: 緑ドット（w-2 h-2 rounded-full bg-green-500）+ "接続済み" text-xs text-gym-zinc-500
//   未設定: "未設定" text-xs text-gym-zinc-400
//   右端に削除ボタン（"削除" text-xs font-bold text-gym-accent bg-red-50 rounded-lg）。hasApiKey が true の時のみ表示
//
// タップターゲット: 全ボタン before:absolute before:inset-[-10px] で 44px 確保（通常の min-h/min-w でも可）
// フォーカス: raw <button> には focus-ring ユーティリティを付与（T-003 キーボード操作対応）

// -------------------------------------------------------
// ExerciseMasterSection (src/components/settings/ExerciseMasterSection.tsx)
// -------------------------------------------------------

// コンテナ: <SectionCard label="種目マスター">（ラベルはカード外側 text-[10px] uppercase tracking-widest）
//
// データ参照: useExercises() フックから { search, create, update, remove } を取得（後述 Hook Layer 参照）
//   ※ ExerciseRepository を UI から直接 import することは禁止（useExercises() 経由のみ）
//
// 検索フィールド（border-b で区切り、セクションカードの上段）:
//   PhMagnifyingGlass アイコン + input
//   bg-gym-zinc-100 rounded-xl px-4 h-10 text-sm（design-system.html FRAME5 準拠）
//   placeholder: "種目を検索..."
//   onChange で setQuery のみ実行し、search(query) で都度フィルタ（Repository 呼び出しなし、state 派生）
//
// 種目一覧:
//   通常行は <ExerciseRow>（名前 + 編集 PhPencilSimple のみ、design-system.html FRAME5 準拠）
//   編集中の行はインラインフォーム（下記）に差し替わる
//   削除操作は編集モード時のインラインフォーム内で提供（通常行には置かない）
//   区切り: divide-y divide-gym-zinc-100
//
// 追加ボタン（初期状態）:
//   PhPlus + "種目を追加" text-sm text-zinc-500
//   h-12 flex items-center gap-2
//
// インライン追加/編集フォーム:
//   - 追加: 「種目を追加」タップで、同じ場所に入力 + PhCheck + PhX を展開
//   - 編集: ExerciseRow の編集ボタンで、対象行を「入力 + PhTrash + PhCheck + PhX」に差し替え
//          （通常行には削除ボタンを置かず、編集モード中にのみ削除を提供する design-system.html 準拠）
//   - 入力: bg-gym-zinc-100 rounded-xl px-3 h-10 text-sm, autoFocus
//   - PhTrash（text-gym-accent、編集モード時のみ）: 削除 → useExercises().remove(id)
//   - PhCheck（text-green-600）: 確定 → useExercises().create/update → 一覧は hook が自動再購読
//   - PhX（text-gym-zinc-500）: キャンセル → フォーム閉じる
//   - 空文字確定はキャンセル扱い（trim 後の空文字を検出）
//   - 重複名エラーの inline 表示:
//       - Repository が throw する `Duplicate name:` prefix を `isDuplicateNameError()` で判定
//       - `addError` / `editError` state で管理し、フォーム直下に role="alert" + aria-live="polite" で表示
//       - エラー文言: 「この種目名は既に登録されています」（`DUPLICATE_ERROR_MESSAGE` 定数）
//       - 入力変更時・キャンセル時に自動クリア
//       - `aria-invalid` + `aria-describedby` で入力フィールドとエラーを紐付け
//       - その他の不正値（throw するが Duplicate 以外）はサイレント無視してフォームを閉じる
//
// タップターゲット: 全ボタン min-h-[44px] min-w-[44px]
// フォーカス: 全 raw <button> に focus-ring ユーティリティを付与（T-003）
```

---

# 7. 非機能要件実現方針

| 要件 | 実現方針 |
|------|--------|
| セキュリティ（NFR-001）: APIキーの保護 | settingsStore が localStorage のみで永続化。外部通信なし。`type="password"` でデフォルトマスク。300ms debounce で途中入力状態の意図しない保存も抑制 |
| 操作性（NFR-002）: 検索のリアルタイム更新 | `useExercises` hook 経由で Zustand store の種目一覧を取得し、`search(query)` は `useMemo` でメモ化した state 派生フィルタで都度再計算（Repository 直呼出なし）。他タブ変更は `storage` event で自動同期。デバウンスなし |
| アクセシビリティ（T-003）: フォーカスリング | 全 raw `<button>` に `focus-ring` ユーティリティ（`focus-visible:ring-2 ring-gym-black ring-offset-2`）を適用。キーボード操作時のみ表示 |

---

# 8. テスト戦略

| テストレベル | 対象 | カバレッジ目標 | 対応FR |
|-----------|------|------------|--------|
| ユニットテスト | settingsStore（setApiKey, deleteApiKey, loadApiKey, hasApiKey 派生） | 全操作 | FR-004, FR-006 |
| コンポーネントテスト | APIKeySection（入力、マスク切替、削除、ステータス表示） | 主要インタラクション | FR-003, FR-004, FR-005, FR-006 |
| コンポーネントテスト | ExerciseMasterSection（検索、一覧表示、追加、編集、削除） | 主要インタラクション | FR-007, FR-008, FR-009 |
| コンポーネントテスト | ExerciseRow（表示、編集ボタンクリック） | 基本表示 | FR-007 |
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
| 空文字 setApiKey の扱い | throw vs 内部で delete 相当 | **内部で delete 相当**（v1.2 で変更）| UI 層・将来の消費者（AI chat 等）が `setApiKey(userInput)` を直接渡しても例外にならないよう契約を単純化。明示的削除には引き続き `deleteApiKey()` を推奨 |
| セクションカードの共通化 | 各セクションでクラス直書き vs 共通コンポーネント | 共通 `<SectionCard>` | FRAME5 のカードスタイルが 2 箇所以上で使われるため、shadcn `<Card>` をラップして一元化。将来のセクション追加にも対応 |
| APIキーの保存タイミング（v1.3 再検討） | onChange 即保存 vs debounce | **UI 側 300ms debounce + 可視フィードバック**（'saving' → 'saved' → 'idle'）| キー1文字ごとに localStorage 書き込みが走るのは無駄。300ms 無入力で確定（`useRef` + `setTimeout` で実装、store の純粋性は維持）。保存状態を aria-live で可視化することで「自動保存されているか不安」という UX 課題も解消 |
| 種目データのUIアクセス | Repository 直参照 vs Hook 経由 | **`useExercises` フック経由のみ**（v1.3）| Repository 直参照は一貫性の崩れ（他タブ変更の取りこぼし・subscribe 漏れ）を招く。UI→Hook→Store→Repository に統一し、同タブ内の複数コンシューマ（ExerciseMasterSection / ExerciseSearchField 等）間で状態を自動同期 |
| 重複名エラーの UX | サイレント無視 vs インライン表示 | **インラインエラーメッセージ**（v1.3）| サイレント無視はユーザに「なぜ登録されないか」が伝わらない。`Duplicate name:` prefix で識別し、フォーム直下に `role="alert"` + `aria-live="polite"` で視覚・SR 両方に通知、再入力で自動クリア。それ以外の throw は従来通りサイレント。将来の toast 基盤導入時に差し替え可能な state ベース設計 |

## 9.2. 未解決の課題

*未解決の課題なし（実装開始可能）*

---

# 10. 変更履歴

## v1.3 (2026-04-18) — 実装整合 & design-system.html 反映

**design-system.html FRAME5 準拠**:

- **SettingsContent**: 画面内タイトル「設定」の記述を削除し、レイアウトを `pt-16 pb-12 px-4 space-y-6` に修正（右上 X ボタンのみ・画面内ヘッダなし）
- **ExerciseRow**: 通常行の責務を「名前 + 編集ボタンのみ」に修正。削除は編集モード時のインラインフォーム内で提供
- **SectionCard**: ラベル位置をカード外側（`text-[10px] uppercase tracking-widest`）、カードスタイルを `rounded-[20px] shadow-soft border border-gym-zinc-100 overflow-hidden` に更新
- **APIKeySection / ExerciseMasterSection**: 入力フィールドの高さを `h-11` / `h-10`、配色を `gym-zinc-*`・`bg-green-500`・`text-gym-accent` に正規化

**アーキテクチャ整合**:

- **Hook Layer 追加**: ExerciseMasterSection の種目データアクセスを `useExercises()` フック経由に統一（Repository 直参照禁止、`useState` + `refresh()` は撤去）。§4.1 mermaid 図・§4.2 モジュール表にも反映
- **settingsStore.setApiKey 空文字挙動**: §6 サンプル TypeScript を v1.2 契約（空文字 = 内部で削除扱い）に追従。従来は §6 が throw 版のまま stale していた

**UX 強化（実装済み機能の仕様反映）**:

- **APIKeySection debounce + saveStatus**: 300ms debounce（`useRef` + `setTimeout`）+ `SaveStatus = 'idle' | 'saving' | 'saved'` の aria-live 可視フィードバック（1500ms ホールド）を §6 と §9.1 に追記
- **重複名エラー UX**: ExerciseMasterSection の追加/編集で `Duplicate name:` を `isDuplicateNameError()` で判定 → インラインフォーム直下に `role="alert"` + `aria-live="polite"` でエラーメッセージ表示、`aria-invalid` + `aria-describedby` で入力フィールドと紐付け。それ以外の throw は従来通りサイレント
- **T-003 フォーカスリング**: 全 raw `<button>` に `focus-ring` ユーティリティを適用する方針を §6 / §7 に明記

**§7 非機能要件・§9.1 決定事項**:

- §7 に debounce / Zustand hook / focus-ring 方針を追記
- §9.1 に「APIキーの保存タイミング（v1.3 再検討）」「種目データのUIアクセス」「重複名エラーの UX」の 3 行を追加

**spec-reviewer 指摘反映（v1.3 フォロー）**:

- spec §7.3 シーケンス図を `useExercises → ExerciseStore → ExerciseRepository` の 3 段に更新（Hook 層を図示）
- design §7 NFR-002 の実現方針を「`useExercises().search(query)` による state 派生フィルタ」に訂正（§6 との矛盾解消）
- spec §8 制約に「T-002: localStorage / JSON アクセスは try-catch でエラーハンドリング」「種目マスターへの UI アクセスは useExercises 経由のみ」を追加
- spec §6 使用例の `onEdit={...}` プレースホルダを型付きシグネチャに置換

## v1.2 (2026-04-12) — レビュー反映（契約修正）

- `settingsStore.setApiKey` の契約を変更: 空文字列は throw せず内部で削除扱いに
- APIKeySection の handleChange を `setApiKey(value)` 単発呼び出しに簡素化
- §9.1 決定事項の「空文字 setApiKey の扱い」行を v1.2 方針に更新

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
