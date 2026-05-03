# ADR: workout

## Zustand persist + リポジトリパターンの分離

- **決定**: セッションドラフト（`draftExercises`）は `persist` ミドルウェアで自動保存し、正式保存は `WorkoutRepository.save()` 経由のみとする
- **理由**: リロード時の自動復元を実現しつつ、ドラフトと永続データを明確に分離。B-001（localStorage-only）に準拠。

## localStorage を採用（IndexedDB 不採用）

- **決定**: IndexedDB が使用可能であっても localStorage を使用
- **理由**: ワークアウトデータ量（数百件）は localStorage の容量内に収まる。実装コストが低い。

## セーブ時に exerciseName をスナップショット保存

- **決定**: `Workout` に `exerciseId` と `exerciseName` の両方を保存する
- **理由**: 種目マスタが削除・リネームされても履歴表示が壊れない。AI が参照する際にも名前があると利便性が高い。

## recording 状態の排他制御（同時に 1 種目のみ）

- **決定**: `recording` 状態になれる種目は常に 1 つに限定する。他の種目は自動的に `idle` に降格する。
- **理由**: UI の散漫化を防ぎ、ユーザーの入力集中を促す。

## 前セットの重量・回数を次の pending セットに引き継ぐ

- **決定**: `completeSet` 後、次の `pendingSet` を直前セットの weight/reps で初期化する
- **理由**: 同一種目での連続セットで毎回入力し直すコストを削減する。

## 3 状態カードモデル（collapsed / idle / recording）

- **決定**: `collapsed` / `idle` / `recording` の 3 状態のみ使用（4 状態にしない）
- **理由**: 「空」と「完了」の区別は冗長。UI の単純化により状態管理のコストを下げる。

## onClick で store action をラップする

- **決定**: onClick ハンドラでは store action をアロー関数でラップする（直接渡さない）
- **理由**: Zustand の `persist` ミドルウェアと React の SyntheticEvent のシリアライズバグを回避するためのワークアラウンド。

## PendingSet の weight/reps を `number` 型にする

- **決定**: `PendingSet` の `weight` と `reps` フィールドの型は `string` ではなく `number`
- **理由**: `SetRowInput` が `Number()` 変換を適用してからストアに渡している。ストアの型はフォーム入力値ではなく実際の状態を反映すべき。
