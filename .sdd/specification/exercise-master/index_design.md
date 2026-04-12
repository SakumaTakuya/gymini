---
id: "design-exercise-master"
title: "種目マスター管理"
type: "design"
status: "draft"
sdd-phase: "plan"
impl-status: "implemented"
created: "2026-03-28"
updated: "2026-04-12"
depends-on: ["spec-exercise-master"]
tags: ["exercise", "master-data", "phase-1"]
category: "core"
priority: "high"
risk: "high"
---

# 種目マスター管理

**関連 Spec:** [index_spec.md](index_spec.md)
**関連 PRD:** [index.md](../../requirement/exercise-master/index.md)

---

# 1. 実装ステータス

**ステータス:** 🟢 実装完了

| モジュール/機能 | ステータス | 備考 |
|-------------|--------|------|
| ExerciseRepository.getAll | 🟢 実装完了 | 全件取得 |
| ExerciseRepository.search | 🟢 実装完了 | 部分一致検索（FR-005） |
| ExerciseRepository.create | 🟢 実装完了 | 重複名チェック付き新規登録（FR-006, FR-007） |
| ExerciseRepository.update | 🟢 実装完了 | 重複名チェック付き名前変更（FR-007） |
| ExerciseRepository.remove | 🟢 実装完了 | ID 指定削除（FR-007） |
| useExerciseStore | 🟢 実装完了 | Zustand store（React キャッシュ層、mutation を全 subscriber に伝播） |
| useExercises hook | 🟢 実装完了 | 公開 hook。UI は本 hook のみを介してアクセス。storage event 追従も担当 |

> **UI統合モジュール**: 種目マスターのUIは本モジュールのスコープ外。ワークアウト記録時の検索・自動登録UIは [workout](../workout/index_design.md) モジュール、設定画面での CRUD UIは [settings](../settings/index_design.md) モジュールが担当する。
>
> **依存規約**: UI コンポーネントは `ExerciseRepository` を直接 import してはならない。必ず `useExercises` hook 経由でアクセスする。これにより mutation の反映漏れ・同タブ内複数コンシューマの状態不整合を防ぐ。

---

# 2. 設計目標

- **層分けと一貫した依存方向**: `UI → Hook → Repository → I/O` の一方向依存。UI は Repository を直接触らない
- **純粋関数としての Repository**: ExerciseRepository は React を知らない純粋関数。I/O（localStorage）と業務ルール（重複チェック等）を隠蔽する
- **単一ソースによる React 統合**: `useExerciseStore`（Zustand）を単一キャッシュ層とし、すべての UI は `useExercises` hook 経由でアクセス。mutation は全 subscriber に自動伝播
- **cross-tab 整合性**: 他タブの localStorage 変更を `storage` event で検出し自動再読込
- **他モジュールへの影響なし**: hook の外部インターフェースは安定。将来 IndexedDB や API 化する際も Repository 層の置換で済む

---

# 3. 技術スタック

| 領域 | 採用技術 | 選定理由 |
|------|--------|--------|
| 言語 | TypeScript (.ts) | T-001: TypeScript strict mode |
| 状態管理 | Zustand ^5 | A-001: Library-First。`settingsStore` / `workoutSessionStore` と同じパターンで統一 |
| データ永続化 | localStorage (JSON) | A-002: Client-Only Architecture。ブラウザローカル保存 |
| ID生成 | crypto.randomUUID() | ワークアウトモジュールと統一。外部依存ゼロ（A-001 準拠: 自作理由は依存削減） |
| cross-tab 通知 | `window.addEventListener('storage', ...)` | ゼロ依存・ブラウザ標準。同タブ内は store subscribe で解決するため別機構不要 |

---

# 4. アーキテクチャ

## 4.1. システム構成図

```mermaid
graph TD
    subgraph "UI Layer（利用モジュール）"
        EMS["ExerciseMasterSection<br/>（settings モジュール）"]
        ESF["ExerciseSearchField<br/>（workout モジュール）"]
        AI["AI Chat<br/>（Phase 3 予定）"]
    end

    subgraph "Hook Layer（exercise-master モジュール）"
        UE["useExercises<br/>公開 hook（検索 / CRUD / storage event）"]
    end

    subgraph "Store Layer（実装詳細）"
        ES[(useExerciseStore<br/>Zustand キャッシュ)]
    end

    subgraph "Repository Layer"
        ER[ExerciseRepository<br/>純粋関数・業務ルール]
    end

    subgraph "永続化"
        LS[(localStorage<br/>gymini:exercises)]
    end

    EMS --> UE
    ESF --> UE
    AI -.-> UE
    UE --> ES
    ES --> ER
    ER --> LS

    LS -.storage event.-> UE
```

**依存方向は上から下への一方通行**。UI → Hook → Store → Repository → I/O。UI は Store や Repository を直接 import しない。

> workout モジュールは `useWorkoutSession` hook が内部で `useExercises` を呼び、`searchExercises` / `createExercise` として露出する設計。UIコンポーネント（`ExerciseSearchField`）は props 経由で関数を受け取る（DI）。

## 4.2. モジュール分割

### Repository Layer

| モジュール名 | 責務 | 依存関係 | 配置場所 |
|-----------|------|---------|--------|
| ExerciseRepository | 種目データの CRUD + 業務ルール（重複 / 空名チェック）。React を知らない純粋関数 | localStorage のみ | `src/lib/exerciseRepository.ts` |

### Store Layer（実装詳細 — UI から直接 import 不可）

| モジュール名 | 責務 | 依存関係 | 配置場所 |
|-----------|------|---------|--------|
| useExerciseStore | React 向けキャッシュ。mutation 後に `ExerciseRepository.getAll()` を再読み込みして全 subscriber に伝播 | ExerciseRepository | `src/stores/exerciseStore.ts` |

### Hook Layer（公開インターフェース）

| モジュール名 | 責務 | 依存関係 | 配置場所 |
|-----------|------|---------|--------|
| useExercises | 公開 hook。検索 / CRUD / cross-tab 同期 を担当 | useExerciseStore | `src/hooks/useExercises.ts` |

### 利用モジュール（参考 — 各モジュールの設計書で詳細定義）

| 利用元モジュール | 利用する hook API | 用途 | 参照先 |
|------------|----------|------|--------|
| workout | search (via useWorkoutSession), create (via useWorkoutSession) | ワークアウト記録時の種目検索・自動登録 | [index_design.md](../workout/index_design.md) |
| settings | exercises, search, create, update, remove | 設定画面での種目一覧・検索・追加・編集・削除 | [index_design.md](../settings/index_design.md) |
| ai-chat（Phase 3） | exercises, search | AI がコンテキストとして種目一覧を参照 | 未定義（Phase 3 スコープ — 設計書未作成） |

---

# 5. データモデル

```typescript
// localStorage キー
// このキーは ExerciseRepository が排他的に所有する。他のモジュールはこのキーに直接アクセスしてはならない。
const STORAGE_KEY = 'gymini:exercises'

// 保存形式: JSON配列
// 型定義: src/types/index.ts の Exercise インターフェース
// [
//   { id: "uuid-v4", name: "ベンチプレス" },
//   { id: "uuid-v4", name: "スクワット" }
// ]
```

---

# 6. インターフェース定義

```typescript
// ExerciseRepository (src/lib/exerciseRepository.ts)
// 純粋関数群。localStorage を直接読み書きする。

import type { Exercise } from '../types'

export function getAll(): Exercise[] {
  // localStorage から全種目を返す。返却順は登録順（配列順）。
  // 失敗時・空の場合は []
}

export function search(query: string): Exercise[] {
  // 部分一致検索。大文字小文字を区別しない。
  // query が空文字列または空白のみ（trim 後に空文字列）の場合は全件返す
}

export function create(name: string): Exercise {
  // 新しい種目を登録する。
  // id は crypto.randomUUID() で生成。
  // name が空文字列または空白のみの場合はエラーをスローする。
  // name が既存の種目名と重複する場合はエラーをスローする。
  // throws: Error("Exercise name is empty") — name が空/空白のみ
  // throws: Error("Duplicate name: {name}") — 名前重複時
}

export function update(id: string, name: string): Exercise {
  // 指定IDの種目名を変更する。
  // name が空文字列または空白のみの場合はエラーをスローする。
  // name が他の種目名と重複する場合はエラーをスローする。
  // id が存在しない場合はエラーをスローする。
  // throws: Error("Exercise name is empty") — name が空/空白のみ
  // throws: Error("Exercise not found: {id}") — ID不存在時
  // throws: Error("Duplicate name: {name}") — 名前重複時
}

export function remove(id: string): void {
  // 指定IDの種目を削除する。存在しないIDの場合は何もしない。
}
```

## 6.1. useExercises hook（公開インターフェース）

```typescript
// src/hooks/useExercises.ts
// UI コンポーネントは本 hook のみを介して種目データにアクセスする。

import type { Exercise } from '@/types'

export function useExercises(): {
  // 最新の種目一覧（store に subscribe）
  exercises: Exercise[]
  // 部分一致検索。state 変更で再計算（useMemo でメモ化）
  search: (query: string) => Exercise[]
  // 新規登録。throws: Repository と同じエラー (Duplicate name: / Exercise name is empty)
  create: (name: string) => Exercise
  // 名前変更。throws: Repository と同じエラー
  update: (id: string, name: string) => Exercise
  // 削除。存在しないIDは何もしない
  remove: (id: string) => void
}
```

**特性**:
- マウント時に `load()` を自動実行し、最新の localStorage 状態と同期
- `window`'storage' event を購読し、他タブでの localStorage 変更を自動反映
- mutation (create/update/remove) は store 状態を更新 → 全 subscriber が再レンダリング
- エラーは Repository から素通しで throw（UI 側で catch して inline error 表示等）

---

# 7. 非機能要件実現方針

| 要件 | 実現方針 |
|------|--------|
| データ整合性（NFR-001）: 種目名の一意性 | `create()` / `update()` 内で `getAll()` を呼び、同名の種目が存在しないことを確認してから保存。大文字小文字の違いは別名として扱う |
| 操作性（NFR-002）: 検索の即時応答 | `useExercises().search()` が store のキャッシュ配列を `Array.filter()`。数百件規模では十分高速 |
| 一貫性（NFR-002）: 同タブ内複数コンシューマの同期 | mutation はすべて `useExerciseStore` 経由で実行。store 更新 → 全 subscriber が再レンダリング |
| 一貫性（NFR-002）: cross-tab 同期 | 他タブでの変更は `window.addEventListener('storage', ...)` で検出。`gymini:exercises` キー変更時のみ `load()` |
| エラーハンドリング（T-002） | localStorage の JSON.parse を try-catch で囲み、パース失敗時は空配列にフォールバック |

---

# 8. テスト戦略

> **カバレッジ目標:** >= 80%（D-001: CONSTITUTION.md）

| テストレベル | 対象 | カバレッジ目標 | 対応FR |
|-----------|------|------------|--------|
| ユニットテスト | ExerciseRepository.getAll | 全件取得、空データ、localStorage 破損時のフォールバック | - |
| ユニットテスト | ExerciseRepository.search | 部分一致、空クエリで全件、大文字小文字無視 | FR-005 |
| ユニットテスト | ExerciseRepository.create | 正常登録、重複名エラー | FR-006, FR-007 |
| ユニットテスト | ExerciseRepository.update | 正常変更、重複名エラー、存在しないIDエラー | FR-007 |
| ユニットテスト | ExerciseRepository.remove | 正常削除、存在しないID | FR-007 |
| hook テスト | useExercises.exercises / search / CRUD | 初期ロード、mutation 後の反映 | FR-005, FR-006, FR-007 |
| hook テスト | useExercises 複数 subscriber | 1 コンシューマの mutation が他 subscriber に即反映 | NFR-002 |
| hook テスト | useExercises storage event | 他タブ変更（gymini:exercises キー）で reload。他キーは無視 | NFR-002 |

> **UI・統合テスト**: 種目マスターの UI テスト（設定画面での CRUD 操作、ワークアウト記録時の自動登録フロー）は利用モジュール（[settings](../settings/index_design.md)、[workout](../workout/index_design.md)）のテスト戦略で定義する。

---

# 9. 設計判断

## 9.1. 決定事項

| 決定事項 | 選択肢 | 決定内容 | 理由 |
|---------|--------|--------|------|
| モジュールのスコープ | Repository のみ vs Repository + Hook + Store | Repository + Hook + Store（3 層） | v2.0 の「Repository のみ」方針では、UI 側が各自 `useState + refresh()` を持つため同タブ内の複数コンシューマ（`ExerciseMasterSection` / `ExerciseSearchField`）間で状態が同期しない問題が発生。Hook 層を導入して単一ソース化することで解決（2026-04-12 修正） |
| 状態管理ライブラリ | Zustand vs useSyncExternalStore vs Context | Zustand | プロジェクト標準（`settingsStore`, `workoutSessionStore`）と統一。useSyncExternalStore は同タブ内で `storage` event が発火しないため pub/sub 機構を自前で実装する必要があり煩雑 |
| UI からの Repository 直接 import | 許可 vs 禁止（hook 経由強制） | 禁止（規約） | Repository を直接 import すると mutation が store キャッシュをバイパスし、他の subscriber の表示が stale になる。UI は `useExercises` のみを介す |
| create の入力 | `create(name)` vs `create({ name })` | `create(name)` | 入力が name の1フィールドのみ。オブジェクトにラップする必要がない |
| update の入力 | `update(id, name)` vs `update(id, { name })` | `update(id, name)` | create と同様、変更対象は name の1フィールドのみ |
| 重複名の判定 | 大文字小文字を区別 vs 区別しない | 区別する | 「ベンチプレス」と「べんちぷれす」は異なる種目として扱う。日本語の種目名では実用上問題にならない。Note: search() は case-insensitive（検索ヒット率優先）だが、create()/update() の一意性チェックは case-sensitive（格納時の厳密性）。この非対称は意図的 |
| 空白名の入力バリデーション | Repository 内で検証 vs 呼び出し側の責務 | Repository 内で検証 | create()/update() は空文字列・空白のみの name を受け付けずエラーをスローする。UIバリデーションとの二重チェックとなるが、Data Layer の堅牢性を優先 |
| 初期データ（初回起動時） | シードデータあり vs 空リスト | 空リスト | 初回起動時はユーザーが自分で種目を追加する。プリセット種目は要求にないため提供しない |
| B-002 確認ゲートの責務 | Repository 内で実装 vs 呼び出し側の責務 | 呼び出し側の責務 | ExerciseRepository は B-002 確認ゲートを内部実装しない。AI が write 操作（create/update/remove）を呼び出す場合、呼び出し側（Phase 3 ai-chat モジュール）がユーザー確認を実装する責務を持つ |
| remove 時のワークアウト記録 | 連鎖削除 vs 何もしない | 何もしない | spec 制約事項に従い、ワークアウト記録は `exerciseName` スナップショットでフォールバック表示する |
| update 時のワークアウト記録 | スナップショット更新 vs 何もしない | 何もしない | ワークアウト記録の `exerciseName` は記録時のスナップショットであり、種目マスターの名前変更は既存記録に影響しない |
| 種目の並び順 | 五十音順 vs 登録順 | 登録順（配列順） | PRD に並び順の要求なし。並び替えが必要になった時点で追加実装する |
| 存在しないIDの remove | エラーをスロー vs 何もしない | 何もしない | 冪等性を確保。UIからの呼び出し時に不整合を起こさない |
| 存在しないIDの update | エラーをスロー vs 何もしない | エラーをスロー | 更新操作は対象の存在が前提。存在しないIDの更新はプログラムバグの兆候であり、明示的にエラーとする |

## 9.2. 未解決の課題

*未解決の課題なし（実装開始可能）*

---

# 10. 変更履歴

## v2.1 (2026-04-12) — Hook 層の導入と一貫した依存方向

**変更内容:**

- `useExerciseStore`（Zustand）と `useExercises` hook を新設し、UI → Hook → Repository → I/O の一方向依存を確立
- `ExerciseMasterSection` の `useState<Exercise[]>` + `refresh()` パターンを撤去
- `ExerciseSearchField` の `ExerciseRepository.create` 直接呼び出しを撤去し、`createExercise` prop として `useWorkoutSession` から DI
- cross-tab 同期（`storage` event）を hook 層で実装
- 設計判断テーブルを更新: モジュールスコープを「Repository のみ」から「Repository + Hook + Store」に変更
- 依存規約を明文化: UI コンポーネントから `ExerciseRepository` 直接 import 禁止

**背景:**

v2.0 の「Repository のみ」設計では、各 UI が自前で `useState` + 手動 `refresh()` を持つため、同タブ内の複数コンシューマが独立したキャッシュを持ち、`ExerciseSearchField` の自動登録が `ExerciseMasterSection` に反映されない問題があった（settings レビュー指摘 FR-009 / NFR-002 強化）。

## v2.0 (2026-04-11) — PRD・設定画面仕様との整合

**変更内容:**

- `impl-status` を `"implemented"` から `"not-implemented"` に修正（実装が存在しないため）
- `update(id, name)` メソッドを追加（PRD FR_007 の「編集」対応）
- アーキテクチャを刷新: ExerciseRepository（Data Layer）のみに集中。UI統合は設定画面モジュール・ワークアウトモジュールが担当
- `ExerciseMasterPage`（スタンドアロンページ）を削除。設定画面の `ExerciseMasterSection` に統合（[index_design.md](../settings/index_design.md) 参照）
- `useExerciseMaster` Hook を削除。設定画面セクションが ExerciseRepository を直接利用
- 種目リネーム機能をスコープ内に変更（旧: Phase 1 スコープ外）

## v1.1 (2026-03-29)

**変更内容:**

- TypeScript 移行に合わせてファイル名・コード例を `.ts`/`.tsx` に更新（T-001 準拠）
- 技術スタックに Language（TypeScript）行を追加
- 制約 ID 参照を旧 DC_xxx から CONSTITUTION.md 原則 ID（A-001, A-002, T-001, T-003）に更新

## v1.0 (2026-03-28)

**変更内容:**

- 初版作成
