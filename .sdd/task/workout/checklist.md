---
id: "task-workout-checklist"
title: "ワークアウト記録管理 品質チェックリスト"
type: "task"
status: "pending"
sdd-phase: "tasks"
created: "2026-03-13"
updated: "2026-03-13"
depends-on: ["design-workout"]
tags: ["workout", "crud", "phase-1", "react", "zustand", "localstorage"]
category: "core"
priority: "high"
---

# 品質チェックリスト: ワークアウト記録管理

## メタ情報

| 項目 | 内容 |
|:---|:---|
| 機能名 | ワークアウト記録管理 |
| 対象仕様書 | `.sdd/specification/workout/index_spec.md` |
| 対象設計書 | `.sdd/specification/workout/index_design.md` |
| 要求仕様書 | `.sdd/requirement/workout/index.md` |
| タスク分解 | `.sdd/task/workout/tasks.md` |
| 生成日 | 2026-03-13 |
| チェックリストバージョン | 1.0 |

## チェックリストサマリー

| カテゴリ | 総項目数 | P1 | P2 | P3 |
|:---|:---|:---|:---|:---|
| 1. 要求レビュー | 10 | 8 | 2 | 0 |
| 2. 仕様レビュー | 7 | 5 | 2 | 0 |
| 3. 設計レビュー | 5 | 3 | 2 | 0 |
| 4. 実装レビュー | 9 | 6 | 3 | 0 |
| 5. テストレビュー | 9 | 6 | 2 | 1 |
| 6. ドキュメントレビュー | 3 | 1 | 1 | 1 |
| 7. セキュリティレビュー | 3 | 1 | 2 | 0 |
| 8. パフォーマンスレビュー | 3 | 0 | 2 | 1 |
| 9. デプロイレビュー | 3 | 2 | 1 | 0 |
| **合計** | **52** | **32** | **17** | **3** |

**優先度レベル**:
- **P1 (High)**: PR作成前に必須
- **P2 (Medium)**: マージ前に完了すべき
- **P3 (Low)**: あると望ましい

---

## 1. 要求レビュー

### CHK-101 [P1] FR-001: ワークアウトCRUD実装

- [ ] ワークアウトの新規作成ができる（`WorkoutRepository.create`）
- [ ] 既存ワークアウトの編集ができる（`WorkoutRepository.update`）
- [ ] ワークアウトの削除ができる（`WorkoutRepository.remove`）
- [ ] 一覧画面から削除できる（`useWorkoutList.deleteWorkout`）
- [ ] フォーム画面から編集モードで開始できる（`useWorkoutSession.startEditSession`）

**検証方法**: `WorkoutRepository` ユニットテスト、`useWorkoutSession` テスト
**関連要求**: FR-001 / FR_001 (PRD)

---

### CHK-102 [P1] FR-002: ワークアウト一覧表示（日付降順）

- [ ] `listByDateDesc()` が日付降順でワークアウトを返す
- [ ] 一覧画面に日付・種目・セット数のサマリーが表示される
- [ ] ワークアウトが存在しない場合、空のリストが表示される（空配列フォールバック）

**検証方法**: `WorkoutRepository.listByDateDesc` ユニットテスト、`WorkoutListPage` 手動確認
**関連要求**: FR-002 / FR_002 (PRD)

---

### CHK-103 [P1] FR-003: セット単位の管理（重量・回数・メモ）

- [ ] 1セットに重量(kg)・回数(reps)・メモ(memo?)を記録できる
- [ ] セットデータが `WorkoutSet` 型定義通りに保存される
- [ ] セットは複数追加できる（上限なし）

**検証方法**: データモデルの型確認、ユニットテスト
**関連要求**: FR-003 / FR_003 (PRD)

---

### CHK-104 [P1] FR-004: ワークアウト全体のメモ

- [ ] ワークアウト単位で自由記述のメモを入力・保存できる
- [ ] メモはオプション（空でも保存可能）
- [ ] `workoutStore.draftMemo` → `setDraftMemo()` → 保存のフローが動作する

**検証方法**: `useWorkoutSession` テスト、手動操作確認
**関連要求**: FR-004 / FR_004 (PRD)

---

### CHK-105 [P1] FR-005: 複数種目のセッション形式記録

- [ ] 1セッション内で複数種目を連続して追加できる
- [ ] セッション中は全データをメモリ内の下書き（`draftExercises`）として保持する
- [ ] 「保存」タップ時にのみ localStorage へ一括書き込みされる（途中保存なし）
- [ ] `saveSession()` 後に一覧が即座に更新される

**検証方法**: `WorkoutFormPage` 統合テスト（複数種目追加→保存フロー）
**関連要求**: FR-005 / FR_005 (PRD)

---

### CHK-106 [P1] FR-006: 前セットの値を自動入力

- [ ] 2セット目以降、直前のセットの重量・回数が自動で初期入力される
- [ ] メモは引き継がない（空になる）
- [ ] `pendingSet` が前セットの `{ weight, reps }` でコピー初期化される
- [ ] ユーザーが値を変更しなければそのまま追加できる

**検証方法**: `SetRowInput` コンポーネントテスト、`ExerciseSection` テスト
**関連要求**: FR-006 / FR_006 (PRD)

---

### CHK-107 [P1] FR-007: 種目選択後の自動フォーカス

- [ ] 種目選択後、重量入力フィールドに自動フォーカスが移る
- [ ] 「セット追加」後も重量入力フィールドに自動フォーカスが移る
- [ ] `useEffect` + `ref.current.focus()` で実装されている
- [ ] モバイル環境でキーボードが自動表示される

**検証方法**: `SetRowInput` コンポーネントテスト（フォーカス動作確認）
**関連要求**: FR-007 / FR_007 (PRD)

---

### CHK-108 [P1] FR-008: 確定済みセットのインライン編集

- [ ] 確定済みセット行をタップすると編集可能状態になる
- [ ] `workoutStore.updateSet(exerciseIndex, setIndex, set)` が `sets[]` の既存要素を更新する（`pendingSet` ではない）
- [ ] 変更確定後に即座に表示に反映される
- [ ] `WorkoutRepository.update(id, input)` で永続化される

**検証方法**: `SetRowInput` コンポーネントテスト（インライン編集）
**関連要求**: FR-008 / FR_008 (PRD)

---

### CHK-109 [P1] NFR-001: 画面遷移2ステップ以内

- [ ] 一覧画面→フォーム画面→保存完了 の2画面遷移で完結する
- [ ] 日付はデフォルトで今日が設定されている
- [ ] 種目選択後の自動フォーカスでタップ数が削減されている（FR-007）

**検証方法**: 手動操作確認（実機またはシミュレーター）
**関連要求**: NFR-001

---

### CHK-110 [P2] NFR-002: データ損失・破損防止

- [ ] `WorkoutRepository` の localStorage 書き込みが `try/catch` でラップされている
- [ ] 読み取り失敗時（JSON.parse エラー等）に空配列 `[]` にフォールバックする
- [ ] 部分的に不正なデータが混在しても他のワークアウトへの影響がない

**検証方法**: ユニットテスト（localStorage エラーシナリオ）
**関連要求**: NFR-002

---

### CHK-111 [P2] 受け入れ基準確認

- [ ] セッション形式でのワークアウト記録フロー（spec Section 6 使用例）が手動で再現できる
- [ ] 編集フローが spec Section 7 振る舞い図通りに動作する
- [ ] インライン編集フローが spec Section 7 振る舞い図通りに動作する

**検証方法**: 手動ユーザーフローテスト

---

## 2. 仕様レビュー

### CHK-201 [P1] WorkoutRepository 公開API実装

- [ ] `getById(id)` が実装されている（戻り値: `Workout | undefined`）
- [ ] `listByDateDesc()` が実装されている（戻り値: `Workout[]`）
- [ ] `listByDate(date)` が実装されている（戻り値: `Workout[]`）
- [ ] `create(input)` が実装されている（戻り値: `Workout`）
- [ ] `update(id, input)` が実装されている（戻り値: `Workout | null`）
- [ ] `remove(id)` が実装されている（戻り値: `void`）
- [ ] `getAll()` は内部ヘルパーであり、外部に公開されていない

**検証方法**: 関数の存在確認、インターフェース定義との照合
**参照**: spec Section 4 API / design Section 6 インターフェース定義

---

### CHK-202 [P1] データモデルの整合性

- [ ] `Workout` 型: `id`, `date`(YYYY-MM-DD), `exercises`, `memo?`, `createdAt`, `updatedAt` が揃っている
- [ ] `WorkoutExercise` 型: `exerciseId`, `exerciseName`(スナップショット), `sets` が揃っている
- [ ] `WorkoutSet` 型: `weight`(number), `reps`(number), `memo?`(string) が揃っている
- [ ] `WorkoutInput` 型: `id`, `createdAt`, `updatedAt` が除外されている
- [ ] `DraftExercise` 型: `sets`(確定済み), `pendingSet`(入力中) が区別されている

**検証方法**: 型定義の照合
**参照**: spec Section 4.1 型定義

---

### CHK-203 [P1] workoutStore インターフェース準拠

- [ ] State: `workouts`, `draftDate`, `draftExercises`, `draftMemo`, `draftWorkoutId` が揃っている
- [ ] `startSession(date, existingWorkout?)` が設計書の仕様通りに動作する
- [ ] `saveSession()` が `draftWorkoutId` に基づき新規作成/更新を自動判別する
- [ ] `updateSet()` が `pendingSet` ではなく `sets[]` の既存要素を更新する
- [ ] 完了後に `draftWorkoutId` が `null` にリセットされる

**参照**: design Section 6 workoutStore インターフェース

---

### CHK-204 [P1] useWorkoutSession 公開API準拠

- [ ] `startEditSession(workout)` が既存ワークアウトを編集モードで開始する
- [ ] `searchExercises(query)` が内部で `ExerciseRepository` を呼ぶ
- [ ] `saveSession()` が `draftWorkoutId` に応じて新規/更新を判別する（store の動作を経由）

**参照**: design Section 6 useWorkoutSession

---

### CHK-205 [P1] 振る舞い仕様の遵守

- [ ] セッション記録フロー（spec Section 7 シーケンス図）通りに動作する
- [ ] 一覧・編集・削除フロー（spec Section 7）通りに動作する
- [ ] インライン編集フロー（spec Section 7）通りに動作する

**参照**: spec Section 7 振る舞い図

---

### CHK-206 [P2] 制約事項の実装

- [ ] `WorkoutCard` は `exerciseName`（スナップショット）を優先表示する
- [ ] `exerciseId` の存在確認は行わない（種目削除後もフォールバック表示）
- [ ] 同一日付に複数のワークアウトを登録可能
- [ ] 種目選択はExerciseRepositoryモジュール経由で行う（直接データを持たない）

**参照**: spec Section 8 制約事項

---

### CHK-207 [P2] localStorage キー整合性

- [ ] localStorage キーが `'gymini:workouts'` で固定されている
- [ ] 日付形式が `YYYY-MM-DD` 文字列で統一されている（Date オブジェクト不使用）

---

## 3. 設計レビュー

### CHK-301 [P1] レイヤーアーキテクチャ準拠

- [ ] UI Layer は Hook Layer のみを参照している（`workoutStore` を直接 import しない）
- [ ] Hook Layer は State Layer と Data Layer を内部で利用している
- [ ] Data Layer は React を import していない（純粋関数）
- [ ] 依存関係: UI → Hook → State → Data の一方向を維持している

**検証方法**: import 文の確認（`grep -r "workoutStore" src/pages/ src/components/` が0件）
**参照**: design Section 4.1 システム構成図

---

### CHK-302 [P1] モジュール配置

- [ ] `src/lib/workoutRepository.js` が存在する
- [ ] `src/lib/exerciseRepository.js` が存在する
- [ ] `src/stores/workoutStore.js` が存在する
- [ ] `src/hooks/useWorkoutList.js` が存在する
- [ ] `src/hooks/useWorkoutSession.js` が存在する
- [ ] `src/pages/WorkoutListPage.jsx` が存在する
- [ ] `src/pages/WorkoutFormPage.jsx` が存在する
- [ ] `src/components/ExerciseSection.jsx` が存在する
- [ ] `src/components/SetRowInput.jsx` が存在する
- [ ] `src/components/WorkoutCard.jsx` が存在する

**参照**: design Section 4.2 モジュール分割

---

### CHK-303 [P1] 技術スタック準拠

- [ ] 状態管理に Zustand を使用している
- [ ] データ永続化に localStorage（JSON）を使用している（IndexedDB 不使用）
- [ ] スタイリングに Tailwind CSS を使用している
- [ ] 日付処理にネイティブ Date API を使用している（外部ライブラリ不使用）
- [ ] ID 生成に `crypto.randomUUID()` を使用している

**参照**: design Section 3 技術スタック

---

### CHK-304 [P2] 設計判断の実装整合性

- [ ] `exerciseName` のスナップショット保存（ID のみでなく名前も保存）が実装されている
- [ ] 記録中の下書き管理がセッション終了時に一括保存で実装されている（都度保存でない）
- [ ] 自動入力の対象が重量・回数のみ（メモは空）になっている
- [ ] 自動フォーカスが種目選択後とセット追加後の両方で発火する

**参照**: design Section 9.1 決定事項

---

### CHK-305 [P2] Phase 3 への拡張性

- [ ] `WorkoutRepository` がストア外からも呼び出せる純粋関数として設計されている
- [ ] `listByDate(date)` が AI 参照ユースケースに対応できる形で実装されている

**参照**: design Section 2 設計目標（Phase 3への拡張性）

---

## 4. 実装レビュー

### CHK-401 [P1] `remove` 関数の命名

- [ ] ワークアウトの削除関数名が `remove` である（`delete` は JS 予約語のため使用禁止）
- [ ] コード内で `delete` 関数として定義・呼び出しされていない

**関連要求**: FR-001 / spec FR-001

---

### CHK-402 [P1] セッション保存の自動判別

- [ ] `saveSession()` 内で `draftWorkoutId === null` のとき `WorkoutRepository.create(input)` を呼ぶ
- [ ] `saveSession()` 内で `draftWorkoutId` が文字列のとき `WorkoutRepository.update(draftWorkoutId, input)` を呼ぶ
- [ ] 保存完了後に `draftWorkoutId` が `null` にリセットされる
- [ ] 保存後に `workouts` が再読み込みされる

---

### CHK-403 [P1] localStorage エラーハンドリング

- [ ] localStorage への書き込み（`setItem`）が `try/catch` でラップされている
- [ ] localStorage の読み取り失敗時（`JSON.parse` エラー、`null` 等）に `[]` を返す
- [ ] エラー時にサイレント失敗しない（コンソールへの出力またはフォールバック動作）

---

### CHK-404 [P1] ID 生成

- [ ] `crypto.randomUUID()` でワークアウト ID を生成している
- [ ] UUID がシステム生成であり、ユーザー入力に依存しない

---

### CHK-405 [P1] `create` / `update` の自動フィールド付与

- [ ] `create(input)` が `id`（UUID）、`createdAt`、`updatedAt` を自動付与する
- [ ] `update(id, input)` が `updatedAt` のみを更新する（`createdAt` は変更しない）

---

### CHK-406 [P1] 自動入力の実装正確性

- [ ] 「セット追加」時に `pendingSet` を `sets[]` に追加する
- [ ] 次の `pendingSet` を直前の `sets` の `{ weight, reps }` でコピーし、`memo` は空にする
- [ ] `pendingSet` ではなく `sets[]` のコピーが初期値として使われている

---

### CHK-407 [P2] コード構造・命名

- [ ] コードがプロジェクトの規約（React/JSX）に従っている
- [ ] ファイル名・変数名・関数名が設計書の定義と一致している
- [ ] デッドコードやコメントアウトされたブロックがない

---

### CHK-408 [P2] エラーメッセージ・ユーザーフィードバック

- [ ] 保存失敗時にユーザーにフィードバックが表示される（サイレント失敗なし）
- [ ] 削除操作は確認なしで即実行または確認ダイアログがある（設計判断に従う）

---

### CHK-409 [P2] コード品質

- [ ] 重複コードがない（共通処理は適切に関数化されている）
- [ ] 関数が単一責務である
- [ ] 過度に複雑な関数（分岐が多すぎる等）がない

---

## 5. テストレビュー

### CHK-501 [P1] WorkoutRepository ユニットテスト

- [ ] `getById`: 存在するID・存在しないIDの両方をテスト
- [ ] `listByDateDesc`: 日付降順のソート順をテスト
- [ ] `listByDate`: 指定日に合致するデータ・合致しないデータをテスト
- [ ] `create`: 返却された Workout に `id`・`createdAt`・`updatedAt` が付与されているかテスト
- [ ] `update`: `updatedAt` が更新され `createdAt` は変わらないことをテスト
- [ ] `remove`: 対象IDが削除され他のデータが残ることをテスト
- [ ] localStorage 読み取り失敗時の `[]` フォールバックをテスト
- [ ] localStorage 書き込み失敗時の動作をテスト

**参照**: design Section 8 テスト戦略 / tasks.md タスク 4.1

---

### CHK-502 [P1] useWorkoutList ユニットテスト

- [ ] マウント時に `loadWorkouts` が呼ばれ `workouts` が設定されることをテスト
- [ ] `deleteWorkout(id)` 呼び出し後に `workouts` から対象が除外されることをテスト
- [ ] `workouts` が日付降順であることをテスト

**参照**: design Section 8 / tasks.md タスク 4.2

---

### CHK-503 [P1] useWorkoutSession ユニットテスト

- [ ] `startSession()` で `draftDate` が今日の日付になり `draftWorkoutId` が `null` になることをテスト
- [ ] `startEditSession(workout)` で `draftWorkoutId`・`draftExercises`・`draftMemo` が設定されることをテスト
- [ ] `addExercise()` 後に `draftExercises` に種目が追加されることをテスト
- [ ] `addSet()` 後に `pendingSet` が `sets[]` に移り、次の `pendingSet` に前セット値がコピーされることをテスト
- [ ] `updateSet()` が `sets[]` の既存要素を更新することをテスト（`pendingSet` 不変）
- [ ] `saveSession()` が `draftWorkoutId === null` のとき `create` を呼ぶことをテスト
- [ ] `saveSession()` が `draftWorkoutId` が文字列のとき `update` を呼ぶことをテスト
- [ ] `cancelSession()` 後に draft 状態がリセットされることをテスト

**参照**: design Section 8 / tasks.md タスク 4.3

---

### CHK-504 [P1] SetRowInput コンポーネントテスト（FR-006, FR-007, FR-008）

- [ ] **FR-006**: 2セット目の `pendingSet` に前セットの `weight`・`reps` が初期入力されていることを確認
- [ ] **FR-006**: `memo` が空であることを確認（引き継ぎなし）
- [ ] **FR-007**: 種目選択後に重量フィールドがフォーカスされることを確認
- [ ] **FR-007**: セット追加後に重量フィールドがフォーカスされることを確認
- [ ] **FR-008**: 確定済みセット行をタップすると編集可能状態になることを確認
- [ ] **FR-008**: 値変更後に `updateSet` コールバックが呼ばれることを確認

**参照**: design Section 8 / tasks.md タスク 4.4

---

### CHK-505 [P1] WorkoutFormPage 統合テスト（FR-005 完全フロー）

- [ ] `useWorkoutSession` をモックして複数種目の追加→保存フローをテスト
- [ ] 保存後に一覧画面へ遷移することをテスト
- [ ] キャンセル時に一覧画面へ遷移することをテスト

**参照**: design Section 8 / tasks.md タスク 4.6

---

### CHK-506 [P2] ExerciseSection コンポーネントテスト

- [ ] 「セット追加」ボタンタップ時のインタラクションをテスト
- [ ] `pendingSet` が確定されて次の `pendingSet` に前セット値がコピーされることをテスト

**参照**: tasks.md タスク 4.5

---

### CHK-507 [P2] エッジケーステスト

- [ ] ワークアウトが0件のとき一覧画面が正常表示される
- [ ] 種目が0件のセッションを保存しようとしたときの動作（エラー or 無効化）
- [ ] localStorage が満杯のとき（容量制限）の動作

---

### CHK-508 [P3] テストカバレッジ目標

- [ ] `WorkoutRepository` の全関数: カバレッジ 100% を目標
- [ ] `useWorkoutList` の全アクション: カバレッジ 100% を目標
- [ ] `useWorkoutSession` の全アクション: カバレッジ 100% を目標

---

## 6. ドキュメントレビュー

### CHK-601 [P1] 設計書の実装ステータス更新

- [ ] `index_design.md` の実装ステータステーブルが全モジュール 🟢 に更新されている
- [ ] `index_design.md` の `impl-status` フロントマターが `implemented` になっている

**参照**: tasks.md タスク 5.1

---

### CHK-602 [P2] 自動入力・フォーカスロジックのコメント

- [ ] `SetRowInput` 内の `useEffect` + `ref.current.focus()` にコメントがある（FR-007 対応であることが分かる）
- [ ] `pendingSet` の初期化ロジックにコメントがある（FR-006 対応であることが分かる）

---

### CHK-603 [P3] README / 使用方法

- [ ] 新規開発者がワークアウト機能のアーキテクチャを理解できるドキュメントがある
- [ ] 設計書へのリンクが適切に整備されている

---

## 7. セキュリティレビュー

### CHK-701 [P1] localStorage データの妥当性検証

- [ ] localStorage から読み取ったデータが不正形式（null, 非配列等）の場合に安全にフォールバックする
- [ ] `JSON.parse` で例外が発生した場合に `try/catch` でキャッチして `[]` を返す

---

### CHK-702 [P2] XSS 対策（ユーザー入力の表示）

- [ ] ワークアウトメモ、種目名、セットメモ等のユーザー入力が React JSX でエスケープされて表示される
- [ ] `dangerouslySetInnerHTML` を使用していない（または使用する場合はサニタイズ済み）

---

### CHK-703 [P2] データの妥当性

- [ ] 重量・回数に数値以外の値が入力された場合の処理が定義されている（入力制限 or フォールバック）
- [ ] 空のワークアウト（種目なし）を保存させない制御がある（任意）

---

## 8. パフォーマンスレビュー

### CHK-801 [P2] localStorage 読み書きパフォーマンス

- [ ] 一覧表示の初期ロードが体感的に問題ない速度で完了する
- [ ] 保存操作後の一覧更新が即座に反映される（`loadWorkouts` の再実行が同期的）

---

### CHK-802 [P2] React 再レンダリング最適化

- [ ] `WorkoutCard` が不必要に再レンダリングされていない（props 変更時のみ）
- [ ] `ExerciseSection` 内のセット一覧が種目追加のたびに全件再レンダリングされていない

---

### CHK-803 [P3] 大量データへの対応

- [ ] ワークアウト記録が 100件以上ある場合も一覧表示が正常動作する
- [ ] 100件程度の localStorage データ（設計書の想定）で容量制限に達しないことを確認

---

## 9. デプロイレビュー

### CHK-901 [P1] localStorage キー定数化

- [ ] `'gymini:workouts'` が定数として定義されており、ハードコーディングされていない
- [ ] 将来のキー変更に対応できる形になっている

---

### CHK-902 [P1] モバイル動作確認

- [ ] スマートフォン（iOS Safari または Android Chrome）で基本フローが動作する
- [ ] 自動フォーカス（FR-007）でキーボードが自動表示される（モバイル実機確認）
- [ ] Tailwind の `sm:` ブレイクポイントによるレイアウトが適切に表示される

---

### CHK-903 [P2] オフライン動作確認

- [ ] サーバー通信なし（ネットワーク未接続）で全機能が動作する
- [ ] ブラウザリロード後もデータが保持されている

---

## 完了基準

### PR 作成前チェックリスト

P1（High）項目がすべて完了している必要があります:

- [ ] すべての P1 項目がチェック済み（32/32）
- [ ] すべてのテストが合格している
- [ ] `/check-spec workout/index` で仕様整合性が確認済み
- [ ] コードレビュー準備完了

### マージ前チェックリスト

P1 と P2 項目がすべて完了している必要があります:

- [ ] すべての P1 項目がチェック済み（32/32）
- [ ] すべての P2 項目がチェック済み（17/17）
- [ ] コードレビュー承認済み
- [ ] CI/CD パイプライングリーン
- [ ] マージ準備完了

### リリース前チェックリスト

P3 までのすべての項目が完了している必要があります:

- [ ] すべての P1 項目がチェック済み（32/32）
- [ ] すべての P2 項目がチェック済み（17/17）
- [ ] すべての P3 項目がチェック済み（3/3）
- [ ] 実機モバイル確認済み（CHK-902）
- [ ] リリース準備完了

---

## 参照ドキュメント

- PRD: [index.md](../../requirement/workout/index.md)
- 抽象仕様書: [index_spec.md](../../specification/workout/index_spec.md)
- 技術設計書: [index_design.md](../../specification/workout/index_design.md)
- タスク分解: [tasks.md](tasks.md)

---

## Notes

- このチェックリストは仕様書・設計書・タスク分解から自動生成されました
- 要件や設計が変更された場合はチェックリストを更新してください
- 認証・DB マイグレーション・サーバーデプロイは本機能のスコープ外です（ブラウザ完結のオフラインアプリ）
- モバイルファーストの設計（DC_004 準拠）のため、モバイル動作確認（CHK-902）を P1 としています
