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

## 書き込み確認 UI: タイムライン上の draft カードに編集フォームを内包

- **決定**: AI が書き込みツール（`saveWorkout` / `addExerciseToSession` / `addExercise`）を呼び出した場合、対応する内容を **draft 状態の ExerciseCard** としてタイムラインに直接挿入する。draft カード内に「保存」「破棄」アクションを内蔵し、承認まではデータに反映しない。セット情報を含むアクションは draft カード内に PendingSetRow 再利用の編集可能フォームを内包する
- **理由**:
  - 旧版（`ConfirmationBubble` 内インラインフォーム）は、確定後に同じセット詳細を ExerciseCard で **二重表示** する DRY 違反を生んでいた
  - draft カード直挿により「セット詳細の表示は ExerciseCard が単一の責任を持つ」という Single Source of UI を確立できる
  - モーダル/シートを使わずタイムラインに置くことで Modeless 操作を維持し、親指リーチ（T-003）を保つ
  - 既存の編集フォーム部品（`PendingSetRow` / `EditableSetRow` / `SaveWorkoutEditor` / `SingleExerciseEditor` / `ConfirmationActions`）は **コンテナを差し替える** ことで温存できる
- **トレードオフ**:
  - `ExerciseCard` に `origin: 'manual' | 'ai-suggested'` バリアントを追加する必要がある
  - `pendingAction` のセマンティクスは「draft カードの保存/破棄」へ移行させる（型・ロジックの段階的書き換え）
- **過去の判断との関係**: 旧版「書き込み確認 UI をインラインに表示」（チャットバブル内）を撤回する

## タイムライン統合 UX の採用（ExerciseCard と ChatMessage を時系列で同一スクロール領域）

- **決定**: ワークアウトセッション中、ExerciseCard と ChatMessage を `timestamp` でマージして同一スクロール領域に並べる。種目カードはセクション単位（カード + 次の種目までの ChatMessage）で `position: sticky` を適用し、stacking で上部に固定する
- **理由**:
  - Direct manipulation（数値入力）と Conversational UI（自然言語）を切り替えなしで併存させる
  - Single source of truth: 種目データの正は ExerciseCard、対話の正は ChatMessage、両者は時系列で並ぶ
  - Modeless: モーダル/シート切替を排し、Locus of attention を維持
  - stacking sticky により、スクロール中もその種目の文脈（後続メッセージ）と入力 UI を常時参照可能
- **トレードオフ**:
  - `ChatMessageList` / `ExerciseList` の責務再編が必要（実施済み）
  - sticky とスクロールの相互作用に関するモバイル各機種互換確認が必要

## 単一入力欄の採用（種目検索を ChatInput が吸収、ExerciseSearchField 撤去）

- **決定**: セッション中の唯一の入力欄が、自然言語コマンド・種目検索・AI への質問を兼ねる。種目名を入力すると候補チップが popover で提示される
- **理由**: Locus of attention 原則。同じ目的（次の操作を入れる）の入力ボックスを画面に複数配置しない
- **トレードオフ**: 種目検索の操作回数がわずかに増える可能性（候補 popover で吸収）。実施済み

## セッション外 write tool は SESSION_NOT_ACTIVE を返す（防御線）

- **決定**: ゲート対象は `saveWorkout` と `addExerciseToSession` の 2 ツールに限定する。`useWorkoutSessionStore.getState().isActive` が false なら `{ success: false, error: 'SESSION_NOT_ACTIVE' }` を返す。`addExercise` はゲート対象外
- **理由**:
  - B-002（AI 安全操作の確認優先）の精神を「UI 撤去後の防御線」として技術的に保証する
  - タイムライン統合後はセッション外で AI に話せないため通常はここに到達しない。ただし防御的に残す
  - `addExercise` は種目マスター登録のみで、セッションと無関係。ゲートすると「セッション開始しないと種目マスターも編集できない」という UX 阻害になる
  - 旧 `executeSaveWorkout` には「`isActive=false` で暗黙 `startSession`」のロジックがあったが、これは UX 上の意図ではなく実装上の便宜であり、削除して SESSION_NOT_ACTIVE 一律返却に整理した
- **過去日付保存（将来要件）**: 「日付指定で過去のワークアウトを補完保存する」UX は将来要件として残す。現状の `executeSaveWorkout` は session に種目を追加するだけで `WorkoutRepository.save` を呼ばないため、過去日付保存は実質未対応。将来 PR で `date !== today()` 分岐を加えて `WorkoutRepository.save` を直接呼ぶフロー（または別ツール）に整理する
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

## 「未登録種目を始める」フローは `addExerciseToSession` の `exerciseId` 省略呼び出しに統合

- **決定**: 未登録種目をユーザーが「やる／始める」と発話した場合、`addExercise` → `addExerciseToSession` の 2 段確認は使わず、`addExerciseToSession` を **`exerciseId` 省略**で 1 回呼び出して 1 つの draft カードで完結させる。`executeAddExerciseToSession` は `exerciseId` が無いとき内部で `ExerciseRepository.create(exerciseName)` を呼び、生成した id でセッションに追加する
- **理由**:
  - 2 段確認は「種目マスターに追加しました」で会話が一区切りしてしまい、ユーザーが追加で発話する/別画面に行く必要が生じる（実際の UX フィードバックを反映）
  - 旧版では専用ツール `addExerciseAndLog` を使っていたが、Phase 7-A のタイムライン UX で `isActive` 必須が確定したため、`addExerciseAndLog` の主機能だった「セッション自動開始」が不要になり、`addExerciseToSession` の単純な引数拡張で代替できる
  - ツール数が減るため、AI への system instruction がシンプルになり Function Calling の精度も上がる期待がある
- **トレードオフ**: 「マスター登録だけしておきたい」ケース用に `addExercise` を温存し、システムインストラクションで「ユーザーが明示した場合のみ」と限定することで使い分ける
- **重複時の挙動**: `exerciseId` 省略 + 既登録名の場合は `DUPLICATE_EXERCISE`、解決後 `exerciseId` が既にアクティブセッションの `draftExercises` にある場合は `EXERCISE_ALREADY_IN_SESSION` を返す。AI には事前に `getExercises` で確認するよう指示する（衝突は通常起きない）

## セッション内重複追加のブロック: `addExerciseToSession` は `EXERCISE_ALREADY_IN_SESSION` を返す

- **決定**: `executeAddExerciseToSession` は、解決済み `exerciseId` が現在の `useWorkoutSessionStore.getState().draftExercises` に既存の場合、`{ success: false, error: 'EXERCISE_ALREADY_IN_SESSION' }` を返してセッションを変更しない。重複検査は `exerciseId` 解決後に行い、`exerciseId` 省略時のマスター作成失敗（`DUPLICATE_EXERCISE`）よりも後に評価する。AI には system instruction で「既存セッションに同じ種目がある状態で値の助言を求められた場合はツールを呼ばずテキストで答える」と指示し、エラーが返ったらテキスト応答に切り替えるようガイドする
- **理由**:
  - AI は `buildActiveSessionContext()` 経由でセッションの `draftExercises` を認識しているが、「ベンチプレス追加して」と「何キロがいいかな」の区別に失敗して `addExerciseToSession` を再呼び出しし、2 枚目の draft カードを生成するバグが観測された
  - プロンプトだけに頼ると LLM の指示不遵守で漏れるため、`SESSION_NOT_ACTIVE` と同じく toolExecutor 側にも防御線を置く
  - `acceptSuggestedExercise` などユーザー操作経由の編集フローと、`workoutSessionStore.addExercise` 自体の挙動は変えず、AI ツール由来の重複追加のみをブロックする
- **トレードオフ**: 同一種目を意図的に複数セクション設けたいケースはブロックされる（筋トレ的にも通常 1 種目 = 1 セクションのため許容）。重複検出キーは解決後 `exerciseId` で、`exerciseName` の表記揺れは検出しない

## アクティブセッション文脈の AI 注入（FR_014）

- **決定**: セッションがアクティブな間、システムインストラクションに「進行中セッションの要約（直近 3 セット等）」を注入する。注入は `getState()` ベースで実行時に解決する
- **理由**:
  - AI が直前のパフォーマンスを踏まえて「前セットからの増減」を提案できる
  - 注入は会話往復ごとに最新化されるため、ユーザー編集後の値も反映される
  - `getState()` 参照によりリアクティブサブスクリプションが不要、再レンダリング/再生成のコストを抑える
- **トレードオフ**: トークン圧迫を避けるため要約形式に限定する

## 種目名のみ言及時の placeholder 提案（FR_015）

- **決定**: 種目名・運動意図のみが述べられた場合、AI は **必ず** `sets:[{0,0}]` の placeholder で書き込みツールを呼び出す。ConfirmationBubble / draft カードでは空入力 + プレースホルダ表示し、ユーザー編集後に確定する
- **理由**:
  - テキストで聞き返す UX は「フォームが出ない」状態を生み、ユーザーが値入力場所を探す摩擦を生む
  - placeholder 経由なら、ユーザーは「フォームが出ている」事実から自然に値入力に進める
  - 0 以外の架空値（例: 50kg/10）を AI が埋めると事実誤認の元になるため、明示的に 0/0 とする
- **トレードオフ**: フォーム disabled 状態が初期値となるため「保存」ボタンの非活性ルールが必要（FR_013）
- **2026-05-17 改訂**: 本ルールの適用範囲を「種目を 1 つに **断定** した発話」に限定した。未決定発話（「何やろう」「胸の日」「メニュー」など）に対しては `proposeAction` を呼ぶ Proposed フローへ振り分ける（FR_037 / 下記 ADR）

## `proposeAction` ツール導入（Proposed UX 分離、FR_037）

- **決定**: 副作用なしの提案チップ専用ツール `proposeAction` を 1 つ追加し、AI 応答を Conversational / Proposed / Committed の 3 形態に分離する。`proposeAction` は read/write のどちらでもない第三カテゴリ（`isProposeTool` 判定）。`useChatService` 内のアダプタ `toProposalMessage(call)` が「actions 付き assistant メッセージ」を 1 つ生成し、`executeProposeTool` は作らない
- **理由**:
  - 旧 system prompt の「種目名のみで必ず write tool を呼べ」が、未決定発話（「何やろう」など）まで誤って Committed 化していた。AI が「決定者」になり、ユーザーの「選びたい」意図を踏みにじる UX バグ
  - Proposer/Decider 分離（AI は提案者・ユーザーは決定者）が AI プロダクト設計の基本原則（Boris Cherny / Sid Bidasaria 系）。chip タップを経由することで B-002 のユーザー確認原則をむしろ強化（chip 選択 + draft 保存の 2 段確認）
  - 新メッセージタイプ（`'assistant-proposal'`）を作らず、既存 ChatMessage に `actions?` / `consumedActionId?` の optional フィールドを追加するだけで表現可能。`messagesToContents` の二値ロール変換ロジックに影響を与えない
- **トレードオフ**:
  - ツール数増加（8 → 9）で Gemini Flash の Function Calling 選択精度がやや低下するリスク。system prompt の 3 モード判定基準を明確に記述し、判定例を 5〜6 個ずつ列挙して緩和する
  - LLM が境界判定を誤る場合（Committed であるべきが Proposed 化）でも、chip タップ 1 回の追加コストで済む。逆方向（Proposed であるべきが Committed 化）は draft カードを破棄して再入力できる
  - 旧 ADR「ツール数最小化」（`addExerciseAndLog` → `addExerciseToSession` 統合）と方針が逆行するが、Proposed UX の表現力には新ツール不可避と判断
- **過去の判断との関係**: 旧版 system prompt「種目名のみの場合は **必ず** 書き込みツールを呼び出してください」の絶対指令を撤回する

## 提案チップの実行経路を kind 別に分岐（FR_038）

- **決定**: 提案チップの kind 3 種それぞれに異なる実行経路を割り当てる
  - `start-exercise`: クライアントで直接 `executeWriteTool('addExerciseToSession', { exerciseName, sets:[{0,0}] })` を呼ぶ
  - `show-history`: クライアントで直接 `executeReadTool('getWorkoutsByExercise', { exerciseName })` を呼ぶ
  - `ask-followup`: `payload.prompt ?? label` を擬似発話として `sendMessage()` で再投入
- **理由**:
  - `start-exercise` / `show-history` は chip タップ時点でユーザーの「決定」が確定済み。AI 再呼出は (1) 1〜2 秒の遅延、(2) 別 tool への迷走で「2 枚目の draft」や「失敗テキスト」のブレ、(3) トークン消費の追加を招く
  - chip payload に `exerciseName` が確定しているため AI 再解釈は冗長
  - `ask-followup` は会話継続が本質なので AI 再呼出が自然
- **トレードオフ**:
  - クライアント側に kind→tool の対応マップが必要（`useChatService` 内のヘルパー関数として実装、独立ファイル化しない）
  - kind を追加する場合は system prompt の例示とディスパッチマップの両方を更新する必要がある
- **エラー時の挙動**: `executeWriteTool` が `SESSION_NOT_ACTIVE` / `EXERCISE_ALREADY_IN_SESSION` を返した場合や `executeReadTool` が失敗した場合は、対応するヒント文言を assistant メッセージとして追加する。`consumedActionId` は更新され同一チップの再タップは no-op
