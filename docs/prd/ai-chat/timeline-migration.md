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

**移行原則:**

- **D-001 Test-First**: 各 Phase は失敗するテストを書いてから実装する
- **D-003 テストが仕様**: PRD と矛盾するテストは PRD 改訂候補として扱う
- **小さな PR**: 1 Phase = 1 PR を原則。ファイル数を抑え、レビューしやすくする
- **後方互換は不要**: 撤去予定のコンポーネント・ルートは対応 Phase で削除する。`// removed` コメント等の名残は残さない

---

## 2. Phase 一覧（依存順）

| Phase | 内容 | 主な変更ファイル | 主なテスト | 依存 |
|:---|:---|:---|:---|:---|
| P1 | チャット寿命同期 + storeBus | `src/stores/storeBus.ts` 新規, `src/stores/chatStore.ts`, `src/stores/workoutSessionStore.ts` | `chatStore.test`, `workoutSessionStore.test`, `persistence.integration.test` | なし |
| P2 | write tool に SESSION_NOT_ACTIVE gate | `src/lib/toolExecutor.ts` | `toolExecutor.test` | なし（P1 と並列可） |
| P3 | DraftExercise に origin 追加 + 受諾/却下 store メソッド | `src/schemas/workout.ts`, `src/stores/workoutSessionStore.ts` | スキーマ・ストアテスト | なし（P1 と並列可） |
| P4 | AI write 提案を draft カードとして挿入（セマンティクス） | `src/hooks/useChatService.ts`, `src/lib/toolExecutor.ts` | `useChatService.test`, `toolExecutor.test` | P3 |
| P5 | ExerciseCard に `origin: 'ai-suggested'` バリアント + 旧 `ConfirmationBubble` 撤去 | `src/components/workout/ExerciseCard.tsx`, `src/components/chat/ConfirmationBubble.tsx` 削除 | `ExerciseCard.test`, ConfirmationBubble テスト削除 | P4 |
| P6 | ActiveSessionView をタイムライン化（時系列マージ + sticky） | `src/components/workout/ActiveSessionView.tsx` | コンポーネントテスト + Playwright e2e | P5 |
| P7 | ChatInput が種目検索を吸収、`ExerciseSearchField` 撤去 | `src/components/chat/ChatInput.tsx`, `src/components/workout/ExerciseSearchField.tsx` 削除 | `ChatInput.test`, e2e | P6 |
| P8 | BottomNav から AI タブ削除、`/_app/ai` を撤去 or 履歴ビューア化 | `src/components/BottomNav.tsx`, `src/routes/_app/ai.tsx` | `BottomNav.test`, ルートテスト | P7 |
| P9（任意）| 過去ワークアウト対話のアーカイブ閲覧 | `WorkoutRepository` 拡張、新規 history 詳細ページ | リポジトリテスト + e2e | P8 |

---

## 3. 各 Phase の進め方

各 Phase で次のサイクルを踏む:

1. **Red**: 該当機能の振る舞いを表すテストを先に追加（または既存テストを期待される新挙動に書き換え）。テストを実行して失敗を確認
2. **Green**: 最小の実装でテストを通す
3. **ADR 任意更新**: アーキテクチャ判断が増えた場合のみ [ai-chat](../../adr/ai-chat.md) / [navigation](../../adr/navigation.md) を追記
4. **PRD 整合確認**: 振る舞いが [ai-chat/index.md](index.md) と矛盾していないか確認。意図的な仕様変更があれば PRD を更新（D-003）
5. **PR 単位でマージ**: ファイル数を絞り、レビュー後に次の Phase へ

---

## 4. Phase 別メモ

### P1: チャット寿命同期 + storeBus

- 新規 `src/stores/storeBus.ts`: `clearChatMessages?: () => void` を持つ薄い登録ハブ
- `chatStore.ts`: Zustand `persist` を導入。キー `gymini:chat`、`version: 1`、`partialize` で `useWorkoutSessionStore.getState().isActive` が true のみ messages を返す
- `workoutSessionStore.ts`: `startSession` / `endSession` の最後で `storeBus.clearChatMessages?.()` を呼ぶ
- 既存の `clearMessages()`（chatStore）はそのまま流用
- ADR 「チャット履歴の永続化方針」「storeBus 中継」は [ai-chat ADR](../../adr/ai-chat.md) に既に記載済み

### P2: SESSION_NOT_ACTIVE gate

- `executeWriteTool` 入口で `useWorkoutSessionStore.getState().isActive === false` なら `{ success: false, error: 'SESSION_NOT_ACTIVE', message: '...' }` を返す
- `executeSaveWorkout` 内の暗黙 `startSession` ロジックを削除
- 既存テストで「saveWorkout が isActive=false でも動く」前提のものは「SESSION_NOT_ACTIVE を返す」へ書き換え

### P3: DraftExercise の origin

- `src/schemas/workout.ts` の `DraftExercise` に `origin?: 'manual' | 'ai-suggested'` を追加（任意フィールド、デフォルト 'manual'）
- `workoutSessionStore.ts` に `acceptSuggestedExercise(index)`, `rejectSuggestedExercise(index)` を追加
- 既存の `addExerciseWithSets` は `origin` を任意で受けるように拡張

### P4: AI write → draft 挿入

- `useChatService.ts` の write tool ハンドリングを `pendingAction` ベースから「直接 store に suggested として挿入 + チャットへ報告メッセージ」へ変更
- `toolExecutor.ts` の `executeAddExerciseToSession` / `executeSaveWorkout` を「即適用」から「`origin: 'ai-suggested'` で挿入」へ書き換え
- 旧 `pendingAction` 関連は P4 では残し、P5 で削除する（テスト連動切替を段階化するため）

### P5: ExerciseCard variant + ConfirmationBubble 撤去

- `ExerciseCard.tsx` に `origin: 'ai-suggested'` 用の表示バリアント（薄色 + 「AI 提案」バッジ + 「保存」「破棄」ボタン）を追加
- `ConfirmationBubble.tsx` と関連テスト・型（`pendingAction`）を削除
- `ChatMessageList` から ConfirmationBubble の表示分岐を削除

### P6: ActiveSessionView タイムライン化

- ExerciseCard と ChatMessage を `timestamp` でマージしてレンダ
- `recording` カードを `position: sticky; top: <ヘッダー高さ>` で上部固定
- 必要に応じて `SessionTimeline.tsx` などに切り出す（任意）
- Playwright e2e: 「種目追加 → AI 発話 → 種目追加 → タイムラインに時系列で並ぶ」シナリオ

### P7: ChatInput が種目検索を吸収

- 入力欄テキストに対し既存 `useExercises().search(text)` で候補チップを popover 表示
- タップで種目を追加 → `addExercise`（origin: 'manual'）
- `ExerciseSearchField.tsx` と `useChatService` 連携の重複を整理
- `ExerciseSearchField` 撤去に伴い、[exercise-master ADR](../../adr/exercise-master.md) と [settings ADR](../../adr/settings.md) の `ExerciseSearchField` 言及を更新（任意・テストが正、ADR 更新は推奨）

### P8: AI タブ撤去

- `BottomNav.tsx` から AI 専用ボタン削除、2 タブ構成に
- `routes/_app/ai.tsx` を削除（または `/training` リダイレクト or 「セッション開始へ誘導」空ページ）
- `AIChatPage.tsx` の役目に応じて削除/縮約
- 旧 `FRAME4` 関連の e2e を削除/書き換え

### P9: 過去対話アーカイブ（任意）

- `WorkoutRepository` の Workout 型に `chatHistory?: ChatMessage[]` 追加可否を ADR で判断
- 採用するなら、`endSession` で対話を含めて保存し、history 詳細ページで閲覧可能にする
- B-001 観点で「ユーザーが明示的にオン/オフできる」設定を追加するかは要 PRD 改訂

---

## 5. 完了条件と本ファイル削除

すべての完了条件を満たしたとき、本ファイル（`timeline-migration.md`）を削除する。

- [ ] P1〜P8 が main にマージ済み
- [ ] `src/components/chat/ConfirmationBubble.tsx` が削除されている
- [ ] `src/components/workout/ExerciseSearchField.tsx` が削除されている
- [ ] `src/components/BottomNav.tsx` に AI 専用ボタンが残っていない
- [ ] `routes/_app/ai.tsx` が撤去または役割転換済み
- [ ] PRD（[ai-chat/index.md](index.md), [workout/index.md](../workout/index.md), [navigation.md](../navigation.md)）の記述と実装が整合している
- [ ] `docs/design-system.html` の旧 FRAME4 セクションが新ビジョンに合わせて更新（または削除）されている
- [ ] P9 の対応有無を ADR で記録した

削除コミットメッセージ例: `docs(prd): remove timeline-migration roadmap (Phase 1-8 complete)`
