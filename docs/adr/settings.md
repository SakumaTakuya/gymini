# ADR: settings

## settingsStore での localStorage 直接操作（persist ミドルウェア不使用）

- **決定**: Zustand の `persist` ミドルウェアを使わず、localStorage を直接操作する
- **理由**: APIKey は単一の文字列値。JSON のシリアライズ/デシリアライズのオーバーヘッドが不要。（`api-key` ADR と同じ判断）

## APIKey 保存に 300ms デバウンスを適用し saveStatus フィードバックを表示

- **決定**: UI 層でキー入力を 300ms デバウンスして保存し、`saveStatus`（saving → saved → idle）を `aria-live` で通知する
- **理由**: キーストロークごとに localStorage へ書き込むのは非効率。デバウンスによりバッチ化する。自動保存への不安を `saveStatus` で解消する。

## 空文字列を `setApiKey()` に渡すと内部で削除処理を実行

- **決定**: `setApiKey('')` が呼ばれた場合、エラーを投げずに内部で削除処理（状態リセット + `removeItem`）を実行する
- **理由**: UI や AI チャット等の呼び出し元がブランチを書かずに生のユーザー入力をそのまま渡せる。

## SectionCard コンポーネントを共通化

- **決定**: FRAME5 のカードスタイリング（`rounded-[20px]`、`shadow-soft`、`border`）を `<SectionCard>` ラッパーコンポーネントとして共通化する
- **理由**: 2 セクション以上で同じスタイルが使われており、一元管理で一貫性を保ち、セクション追加時のコストを下げる。

## ExerciseMasterSection は `useExercises()` hook 経由でアクセス

- **決定**: ExerciseMasterSection は Repository を直接インポートせず `useExercises()` hook 経由でアクセスする
- **理由**: UI→Hook→Store→Repository の依存チェーンを維持し、`ExerciseSearchField` とのミューテーション同期とクロスタブ変更を確保する。（`exercise-master` ADR と同じ判断）

## 重複名エラーをインラインで表示（`role="alert"` + `aria-live`）

- **決定**: 種目名の重複エラーを `Duplicate name:` プレフィックスで検出し、`role="alert"` + `aria-live` のインライン表示で通知する。再入力で自動クリア。
- **理由**: サイレント失敗はユーザーが原因を把握できない。インライン表示により視覚ユーザーとスクリーンリーダーユーザーの両方に通知できる。

## ユーザープロファイルの全フィールドをオプショナルに

- **決定**: プロファイルの全フィールドを nullable（オプショナル）にする
- **理由**: B-001（Privacy-by-Design）に基づき、強制入力なしでの利用を可能にする。入力障壁を下げる。AI は部分的なプロファイルでも機能する。

## システムプロンプト生成を `buildSystemInstruction()` 純粋関数に切り出す

- **決定**: `geminiClient.ts` に `buildSystemInstruction()` 純粋関数を定義し、`SYSTEM_INSTRUCTION` 定数と同じファイルに置く
- **理由**: テスタビリティと凝集性。システムプロンプトのロジックと定義が同一ファイルに集まり、独立してテスト・変更できる。

## ユーザープロファイルは sendMessage 時に `getState()` で参照

- **決定**: `useChatService` は `sendMessage` 実行時に `useUserProfileStore.getState()` を呼び出す（リアクティブなサブスクリプションはしない）
- **理由**: プロファイルは会話中に変わることがほぼない。`getState()` によるタイミング参照はクライアント再生成への依存を排除し、プロファイル変更のたびにクライアントを再作成する複雑さを避けられる。
