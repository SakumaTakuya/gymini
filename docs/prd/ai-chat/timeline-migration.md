---
id: "prd-ai-chat-timeline-migration"
title: "AI チャット → タイムライン UX への移行ロードマップ（使い捨て）"
type: "prd"
status: "draft"
created: "2026-05-09"
updated: "2026-05-09"
depends-on: ["prd-ai-chat", "prd-workout", "prd-navigation"]
tags: ["migration", "timeline", "throwaway"]
category: "ai"
priority: "high"
risk: "high"
---

# AI チャット → タイムライン UX への移行ロードマップ

> **使い捨て前提のドキュメント**: 本ファイルは旧 UX → タイムライン UX への段階的移行のための作業計画である。Phase 8 完了時点で内容が陳腐化するため、移行完了後にこのファイルは削除する。完了条件は本書末尾を参照。

**親要求:** [ai-chat/index.md](index.md), [workout/index.md](../workout/index.md), [navigation.md](../navigation.md)

---

## 1. 目的

[ai-chat/index.md](index.md) で再定義した「ワークアウトセッション内のタイムライン UX」へ、現行コードを段階的に移行する。

現行実装（main）の重要な前提:

- AI 提案の確認 UI は `ConfirmationBubble.tsx` 内に編集可能フォームを持つ（`EditableSetRow`, `SaveWorkoutEditor`, `SingleExerciseEditor`）
- pending action のロジックは `src/lib/chat/pendingAction.ts` に純粋関数化済み
- セッション文脈注入は `src/lib/sessionContext.ts` で実装済み
- Tool: `addExerciseAndLog` が 1 アクション統合で利用可能
- これらの **編集 UI 部品とツール群はタイムライン統合後も再利用** する。コンテナ（チャットバブル → タイムライン上 draft カード）が変わるだけ

**移行原則:**

- **D-001 Test-First**: 各 Phase は失敗するテストを書いてから実装する
- **D-003 テストが仕様**: PRD と矛盾するテストは PRD 改訂候補として扱う
- **小さな PR**: 1 Phase = 1 PR を原則。ファイル数を抑え、レビューしやすくする
- **既存実装の温存**: `EditableSetRow` / `SaveWorkoutEditor` / `SingleExerciseEditor` / `ConfirmationActions` / `pendingAction.ts` は再利用前提
- **後方互換は不要**: 撤去予定のコンポーネント・ルートは対応 Phase で削除する。`// removed` コメント等の名残は残さない

---

## 2. Phase 一覧（依存順）

| Phase | 内容 | 主な変更ファイル | 主なテスト | 依存 |
|:---|:---|:---|:---|:---|
| P1 | チャット寿命同期 + storeBus | `src/stores/storeBus.ts` 新規, `src/stores/chatStore.ts`, `src/stores/workoutSessionStore.ts` | `chatStore.test`, `workoutSessionStore.test`, `persistence.integration.test` | なし |
| P2 | write tool に SESSION_NOT_ACTIVE gate | `src/lib/toolExecutor.ts` | `toolExecutor.test` | なし（P1 と並列可） |
| P3 | DraftExercise に `origin` 追加 + 受諾/却下 store メソッド | `src/schemas/workout.ts`, `src/stores/workoutSessionStore.ts` | スキーマ・ストアテスト | なし（P1 と並列可） |
| P4 | 編集フォーム部品をコンテナ非依存に分離 | `src/components/chat/EditableSetRow.tsx`, `SaveWorkoutEditor.tsx`, `SingleExerciseEditor.tsx`, `ConfirmationActions.tsx` の props 整理 | コンポーネントテスト | なし（リファクタ） |
| P5 | draft カード コンテナの新設（`<ExerciseCardDraft>` 等） + AI write 提案を draft カードとして挿入 | `src/components/workout/ExerciseCard.tsx`（`origin: 'ai-suggested'` バリアント追加）, `src/hooks/useChatService.ts`, `src/lib/toolExecutor.ts` | `useChatService.test`, `toolExecutor.test`, `ExerciseCard.test` | P3, P4 |
| P6 | 旧 `ConfirmationBubble` 撤去（編集フォーム部品の出力先を draft カードに切替） | `src/components/chat/ConfirmationBubble.tsx` 削除, `src/types/chat.ts` の `pendingAction` 関連簡素化 | ConfirmationBubble テスト削除、関連テスト書き換え | P5 |
| P7 | ActiveSessionView をタイムライン化（時系列マージ + sticky） | `src/components/workout/ActiveSessionView.tsx` | コンポーネントテスト + `e2e/ai-chat-inline-edit.spec.ts` 書き換え | P6 |
| P8 | ChatInput が種目検索を吸収、`ExerciseSearchField` 撤去 | `src/components/chat/ChatInput.tsx`, `src/components/workout/ExerciseSearchField.tsx` 削除 | `ChatInput.test`, e2e | P7 |
| P9 | BottomNav から AI タブ削除、`/_app/ai` を撤去 or 履歴ビューア化 | `src/components/BottomNav.tsx`, `src/routes/_app/ai.tsx`, `src/pages/AIChatPage.tsx` | `BottomNav.test`, ルートテスト | P8 |
| P10（任意）| 過去ワークアウト対話のアーカイブ閲覧 | `WorkoutRepository` 拡張、新規 history 詳細ページ | リポジトリテスト + e2e | P9 |

---

## 3. 各 Phase の進め方

各 Phase で次のサイクルを踏む:

1. **Red**: 該当機能の振る舞いを表すテストを先に追加（または既存テストを期待される新挙動に書き換え）。テストを実行して失敗を確認
2. **Green**: 最小の実装でテストを通す
3. **ADR 任意更新**: アーキテクチャ判断が増えた場合のみ [ai-chat.md](../../adr/ai-chat.md) / [navigation.md](../../adr/navigation.md) を追記
4. **PRD 整合確認**: 振る舞いが [ai-chat/index.md](index.md) と矛盾していないか確認。意図的な仕様変更があれば PRD を更新（D-003）
5. **PR 単位でマージ**: ファイル数を絞り、レビュー後に次の Phase へ

---

## 4. Phase 別メモ

### P1: チャット寿命同期 + storeBus

- 新規 `src/stores/storeBus.ts`: `clearChatMessages?: () => void` を持つ薄い登録ハブ
- `src/stores/chatStore.ts`: Zustand `persist` を導入。キー `gymini:chat`、`version: 1`、`partialize` で `useWorkoutSessionStore.getState().isActive` が true のみ messages を返す
- `src/stores/workoutSessionStore.ts`: `startSession` / `endSession` の最後で `storeBus.clearChatMessages?.()` を呼ぶ
- 既存 `clearMessages()`（chatStore）は流用
- ADR 「チャット履歴の永続化方針」「storeBus 中継」は [ai-chat.md](../../adr/ai-chat.md) に既に記載済み

### P2: SESSION_NOT_ACTIVE gate

- 対象は `executeSaveWorkout` と `executeAddExerciseToSession` の 2 ツールに限定
  - `executeAddExerciseToSession` は最新 main で既に gate 済み（`{ success: false, error: 'SESSION_NOT_ACTIVE' }` を返す）
  - `executeSaveWorkout` は旧版で `isActive=false` 時に暗黙 `startSession` を呼んでいたが、これを削除して `SESSION_NOT_ACTIVE` 一律返却に変更
- `addExercise` は対象外（種目マスター登録、セッション無関係）
- `addExerciseAndLog` は対象外（マスター追加 + セッション自動開始 + セット記録の 1 アクション統合設計）
- 既存テスト「saveWorkout: セッションなし: startSession を呼んで…」を「セッションなし: SESSION_NOT_ACTIVE を返す」へ書き換え
- **過去日付保存**: 旧 ADR 案の「`date !== today()` 例外で通常処理」は将来要件として残し、本 Phase では実装しない（現状の `executeSaveWorkout` は `WorkoutRepository.save` を呼ばないため過去日付保存は実質未対応）

### P3: DraftExercise の origin

- `src/schemas/workout.ts` の `DraftExercise` に `origin?: 'manual' | 'ai-suggested'` を追加（任意フィールド、デフォルト 'manual'）
- `workoutSessionStore.ts` に `acceptSuggestedExercise(index)`, `rejectSuggestedExercise(index)` を追加
- 既存の `addExerciseWithSets` は `origin` を任意で受けるように拡張

### P4: 編集フォーム部品をコンテナ非依存に分離

- `EditableSetRow` / `SaveWorkoutEditor` / `SingleExerciseEditor` / `ConfirmationActions` は **すでにコンテナ（ChatBubble）非依存に近い設計** だが、props を見直して「draft カード内」「ConfirmationBubble 内」両方で同等に使えるようにする
- 例: `onCancel` / `onApprove` は呼び出し元から渡す形、disabled 制御も外部からハンドル
- これは純粋なリファクタ Phase（振る舞い変更なし、テスト追加のみ）

### P5: draft カード + AI write 提案の挿入

- `ExerciseCard.tsx` に `origin: 'ai-suggested'` バリアント追加。薄色背景 + 「AI 提案」バッジ + 「保存」「破棄」ボタン
- カード内には P4 で分離済みのフォーム部品（`SaveWorkoutEditor` / `SingleExerciseEditor` / `EditableSetRow`）をマウント
- `useChatService.ts` の write tool ハンドリングを `pendingAction` ベースから「直接 store に suggested として挿入 + チャットへ報告メッセージ」へ変更
- `toolExecutor.ts` の `executeAddExerciseToSession` / `executeAddExerciseAndLog` / `executeSaveWorkout`（今日日付）を「即適用」から「`origin: 'ai-suggested'` で挿入」へ書き換え
- 旧 `pendingAction` 関連は本 Phase では併存（テスト連動切替を段階化）

### P6: 旧 ConfirmationBubble 撤去

- `ConfirmationBubble.tsx` と関連テスト・型（`pendingAction` の確認バブル経路）を削除
- `ChatMessageList` から ConfirmationBubble の表示分岐を削除
- `pendingAction.ts` は draft カード経路のロジックに簡素化または完全撤去（用途消失なら）
- `useChatService.ts` の write tool ハンドリングを完全に draft カード経路に統一

### P7: ActiveSessionView タイムライン化

- ExerciseCard と ChatMessage を `timestamp` でマージしてレンダ
- `recording` カードを `position: sticky; top: <ヘッダー高さ>` で上部固定
- 必要に応じて `SessionTimeline.tsx` などに切り出す（任意）
- e2e: `e2e/ai-chat-inline-edit.spec.ts` を「draft カード内編集」シナリオに書き換え。「種目追加 → AI 発話 → タイムラインに時系列で並ぶ」シナリオを追加

### P8: ChatInput が種目検索を吸収

- 入力欄テキストに対し既存 `useExercises().search(text)` で候補チップを popover 表示
- タップで種目を追加 → `addExercise`（origin: 'manual'）
- `ExerciseSearchField.tsx` と `useChatService` 連携の重複を整理
- `ExerciseSearchField` 撤去に伴い、[exercise-master.md](../../adr/exercise-master.md) と [settings.md](../../adr/settings.md) の `ExerciseSearchField` 言及を更新（任意・テストが正、ADR 更新は推奨）

### P9: AI タブ撤去

- `BottomNav.tsx` から AI 専用ボタン削除、2 タブ構成に
- `routes/_app/ai.tsx` を削除（または `/training` リダイレクト or 「セッション開始へ誘導」空ページ）
- `AIChatPage.tsx` の役目に応じて削除/縮約
- 旧 `FRAME4` 関連の e2e を削除/書き換え

### P10: 過去対話アーカイブ（任意）

- `WorkoutRepository` の Workout 型に `chatHistory?: ChatMessage[]` 追加可否を ADR で判断
- 採用するなら、`endSession` で対話を含めて保存し、history 詳細ページで閲覧可能にする
- B-001 観点で「ユーザーが明示的にオン/オフできる」設定を追加するかは要 PRD 改訂

---

## 5. 完了条件と本ファイル削除

すべての完了条件を満たしたとき、本ファイル（`timeline-migration.md`）を削除する。

- [ ] P1〜P9 が main にマージ済み
- [ ] `src/components/chat/ConfirmationBubble.tsx` が削除されている
- [ ] `src/components/workout/ExerciseSearchField.tsx` が削除されている
- [ ] `src/components/BottomNav.tsx` に AI 専用ボタンが残っていない
- [ ] `routes/_app/ai.tsx` が撤去または役割転換済み
- [ ] PRD（[ai-chat/index.md](index.md), [workout/index.md](../workout/index.md), [navigation.md](../navigation.md)）の記述と実装が整合している
- [ ] P10 の対応有無を ADR で記録した

削除コミットメッセージ例: `docs(prd): remove timeline-migration roadmap (Phase 1-9 complete)`
