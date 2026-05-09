# ADR: ai-chat

## Gemini SDK を直接使用（@google/generative-ai）

- **決定**: REST API ではなく `@google/generative-ai` SDK を採用
- **理由**: Function Calling のパラメータ構築と型定義が SDK で完結し、実装コストを削減できる

## チャット履歴の永続化方針: セッションアクティブ時のみ localStorage に永続化

- **決定**: チャット履歴を localStorage キー `gymini:chat` に Zustand `persist` で永続化する。ただし `partialize` ゲートにより、`useWorkoutSessionStore.getState().isActive === true` の間のみ `messages` を書き出し、非アクティブ時は空メッセージを書き出す
- **理由**:
  - B-001（Privacy-by-Design）の不要データ残留防止と、「セッション中にリロードしても会話が消えない」体験を両立する
  - セッション終了で対話を破棄することで、次のセッションは常にクリーンな状態から始まる
- **トレードオフ**:
  - 過去のセッションに紐づく会話履歴の閲覧はできない（将来要件として PRD のスコープ外節に記載）
  - rehydrate 完了前の最初のレンダで一瞬空表示になる可能性がある（許容）
- **過去の判断との関係**: 旧版「チャット履歴を localStorage に永続化しない」を撤回する

## 書き込み確認 UI: タイムライン上の draft カード直挿（旧インラインバブル廃止）

- **決定**: AI が書き込みツール（`saveWorkout`, `addExerciseToSession`, `addExercise`）を呼び出した場合、対応する内容を **draft 状態の ExerciseCard** としてタイムラインに直接挿入する。draft カード内に「保存」「破棄」アクションを内蔵し、承認まではデータに反映しない
- **理由**:
  - 旧インラインボタン（チャットバブル内 [追加する]/[キャンセル]）は、セット詳細を **チャットバブル本文と確定後の ExerciseCard に二重表示** する DRY 違反を生んでいた
  - draft カード直挿により「セット詳細の表示は ExerciseCard が単一の責任を持つ」という Single Source of UI を確立できる
  - モーダル/シートを使わずタイムラインに置くことで Modeless 操作を維持し、親指リーチ（T-003）を保つ
- **トレードオフ**: ExerciseCard に `origin: 'manual' | 'ai-suggested'` バリアントが必要。既存のセット記録ロジックとの互換を慎重に確保する
- **過去の判断との関係**: 旧版「書き込み確認 UI をインラインに表示」を撤回する

## タイムライン統合 UX の採用（ExerciseCard と ChatMessage を時系列で同一スクロール領域）

- **決定**: ワークアウトセッション中、ExerciseCard と ChatMessage を `timestamp` でマージして同一スクロール領域に並べる。`recording` 状態の ExerciseCard は画面上部に `position: sticky` で固定する
- **理由**:
  - Direct manipulation（数値入力）と Conversational UI（自然言語）を切り替えなしで併存させる
  - Single source of truth: 種目データの正は ExerciseCard、対話の正は ChatMessage、両者は時系列で並ぶ
  - Modeless: モーダル/シート切替を排し、Locus of attention を維持
  - sticky な recording カードにより、スクロール中も入力 UI が常時可視
- **トレードオフ**:
  - `ChatMessageList` / `ExerciseList` の責務再編が必要（実装は段階的、[timeline-migration.md](../prd/ai-chat/timeline-migration.md) Phase 6 で実施）
  - sticky とスクロールの相互作用に関するモバイル各機種互換確認が必要

## 単一入力欄の採用（種目検索を ChatInput が吸収、ExerciseSearchField 撤去）

- **決定**: セッション中の唯一の入力欄が、自然言語コマンド・種目検索・AI への質問を兼ねる。種目名を入力すると候補チップが popover で提示される
- **理由**: Locus of attention 原則。同じ目的（次の操作を入れる）の入力ボックスを画面に複数配置しない
- **トレードオフ**: 種目検索の操作回数がわずかに増える可能性（候補 popover で吸収）。実装は [timeline-migration.md](../prd/ai-chat/timeline-migration.md) Phase 7 で実施

## セッション外 write tool は SESSION_NOT_ACTIVE を返す（防御線）

- **決定**: `executeWriteTool`（`saveWorkout` / `addExerciseToSession` / `addExercise`）の入口で `useWorkoutSessionStore.getState().isActive` を確認し、false なら `{ success: false, error: 'SESSION_NOT_ACTIVE', message: '...' }` を返す。`executeSaveWorkout` 内の暗黙 `startSession` ロジックは削除する
- **理由**:
  - B-002（AI 安全操作の確認優先）の精神を「UI 撤去後の防御線」として技術的に保証する
  - タイムライン統合後はセッション外で AI に話せないため通常はここに到達しない。ただし防御的に残す
- **トレードオフ**: テストと実装でゲート条件のメンテが必要。シンプルさよりも安全側を優先

## Store 間の循環 import 回避: `storeBus` 中継

- **決定**: `chatStore` と `workoutSessionStore` は相互に直接 import せず、新規 `src/stores/storeBus.ts` をハブとして関数を登録・呼び出す
  ```ts
  // storeBus.ts
  type StoreBus = { clearChatMessages?: () => void };
  export const storeBus: StoreBus = {};
  ```
  起動時に `chatStore` が `storeBus.clearChatMessages` を登録し、`workoutSessionStore` の `startSession` / `endSession` から呼ぶ
- **理由**:
  - 循環 import を構造的に回避できる
  - テストで個別ストアをモックしやすい（bus を差し替えるだけで済む）
  - `stores/` レイヤー内に閉じる（CONSTITUTION の依存ルール準拠）
- **トレードオフ**: 間接化により参照ジャンプがやや増える。ただし結合の少なさが上回る

## Gemini モデルを `gemini-flash-latest` に固定

- **決定**: ユーザーによるモデル選択を提供せず、`gemini-flash-latest` に固定
- **理由**: 速度・コスト・Function Calling サポートのバランスが最適

## チャット履歴の API 送信を 50 件に制限

- **決定**: トークン数ではなく、メッセージ件数（50件）で API 送信量を制限
- **理由**: シンプルな実装で通常会話のコンテキストとして十分。トークンオーバーフローを防止できる

## Hook が `contents` 配列を組み立てる（`generate(contents)` パターン）

- **決定**: Hook が `contents` 配列（`modelContent` 保持を含む）を組み立ててから `generate()` に渡す
- **理由**: SDK 結合を Hook 層で吸収する。Gemini 2.5 の `thoughtSignature` を含む `modelContent` の保持など、Function Calling の往復コンテキスト管理は Hook が担うべき責務

## 同ロールのメッセージをマージし、先頭の model エントリを除去

- **決定**: `ChatMessage` → `Content` 変換時に、連続する同ロールのメッセージをマージし、先頭が `model` ロールの場合はそれを除去する
- **理由**: Gemini API は user/model の厳格な交互入力を要求する。`approve`/`reject` のワークフローでは連続する `model` エントリが生成される場合がある
