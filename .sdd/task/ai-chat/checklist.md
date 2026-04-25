---
id: "checklist-ai-chat"
title: "AIチャット × Function Calling 品質チェックリスト"
type: "checklist"
status: "verified"
created: "2026-04-18"
updated: "2026-04-25"
depends-on: ["spec-ai-chat", "design-ai-chat", "task-ai-chat"]
tags: ["ai", "chat", "function-calling", "gemini", "phase-3"]
category: "ai"
priority: "high"
---

> **自動検証結果（2026-04-25）**: P0 全 22 件 PASS / P1 主要項目 PASS。詳細は [verification_report.md](./verification_report.md) を参照。手動確認が残るのは実 API シナリオ（CHK103, CHK504, CHK505, CHK802）。


# 品質チェックリスト: AIチャット × Function Calling

## メタ情報

| 項目           | 内容                                               |
|:-------------|:-------------------------------------------------|
| 機能名          | AIチャット × Function Calling                        |
| チケット番号       | ai-chat                                          |
| 対象PRD        | `.sdd/requirement/ai-chat/index.md`              |
| 対象仕様書        | `.sdd/specification/ai-chat/index_spec.md`       |
| 対象設計書        | `.sdd/specification/ai-chat/index_design.md`     |
| 対象タスク        | `.sdd/task/ai-chat/tasks.md`                     |
| 生成日          | 2026-04-18                                       |
| チェックリストバージョン | 1.0                                              |

## チェックリストサマリー

| カテゴリ        | 総項目数 | P0 | P1 | P2 | P3 |
|:------------|:-----|:---|:---|:---|:---|
| 要求レビュー      | 3    | 2  | 1  | 0  | 0  |
| 仕様レビュー      | 6    | 4  | 2  | 0  | 0  |
| 設計レビュー      | 5    | 3  | 2  | 0  | 0  |
| 実装レビュー      | 6    | 4  | 2  | 0  | 0  |
| テストレビュー     | 5    | 3  | 2  | 0  | 0  |
| ドキュメントレビュー  | 2    | 0  | 2  | 0  | 0  |
| セキュリティレビュー  | 4    | 4  | 0  | 0  | 0  |
| パフォーマンスレビュー | 2    | 1  | 1  | 0  | 0  |
| デプロイレビュー    | 2    | 1  | 1  | 0  | 0  |
| **合計**        | **35** | **22** | **13** | **0**  | **0**  |

**優先度レベル**:

- **P0**: クリティカル - マージ前に必須
- **P1**: 高 - マージ前に完了すべき
- **P2**: 中 - リリース前に完了すべき
- **P3**: 低 - あると望ましい

---

## 1. 要求レビュー

### CHK101 [P0] - 機能要件の網羅性

- [ ] PRD の全機能要件（FR_011, FR_012, FR_012_01〜FR_012_08）が Spec / 実装にマッピングされている
- [ ] 8つのツール（getRecentWorkouts / getWorkoutsByExercise / getWorkoutsByDate / getWorkoutSummary / saveWorkout / getExercises / addExercise / addExerciseToSession）すべてが実装されている
- [ ] REQ_008（インラインUIでの書き込み確認）が実装されている
- [ ] 部分的な実装がない（ツール欠落なし）

**検証方法**:

- PRD の「要求カバレッジ」表と tasks.md の要求カバレッジ表を突き合わせる
- `/check-spec ai-chat` で整合性を検証
- `src/lib/toolDefinitions.ts` と `src/lib/toolExecutor.ts` で 8ツールすべてが定義されていることを確認

**参照**: PRD `.sdd/requirement/ai-chat/index.md` § 2, 3 / Spec § 3.1

---

### CHK102 [P0] - 非機能要件の実装

- [ ] NFR-001: チャット内容が Gemini API 以外へ送信されない（Zustand persist 未使用）
- [ ] NFR-002: APIキーが Gemini API エンドポイント以外に送信されない
- [ ] NFR-003: Gemini API エラー時にランタイムエラーが発生せず、ユーザーにエラーメッセージを表示する
- [ ] NFR-004: APIキー未設定時に適切なエラーメッセージが表示される
- [ ] NFR-005: Gemini API に送信するチャット履歴が直近50件に制限されている

**検証方法**:

- `src/stores/chatStore.ts` で `persist` ミドルウェアが未使用であることを確認
- `src/lib/geminiClient.ts` で `MAX_HISTORY_MESSAGES = 50` が適用されていることを確認
- ネットワークタブで Gemini API 以外へのリクエストがないことを確認
- `getErrorMessage` のエラー種別判定（認証・レート制限・ネットワーク）を検証

**参照**: Spec § 3.2 / Design § 7

---

### CHK103 [P1] - 受け入れシナリオの検証

- [ ] シナリオ1: 読み取り（最新ワークアウト取得）が自律実行で完了する
- [ ] シナリオ3: ワークアウト保存の確認 → approve → 記録成功
- [ ] シナリオ3a: 未登録種目 → 登録提案 → saveWorkout 再実行
- [ ] シナリオ4: 種目追加の確認フロー
- [ ] シナリオ5: セッションへの種目追加（アクティブセッションあり）
- [ ] シナリオ5a: セッション未開始時の「開始 + 追加」提案フロー
- [ ] シナリオ6: AI応答の停止（stopResponse）→ 即座に新メッセージ送信可能
- [ ] シナリオ7: APIキー未設定時の案内メッセージ表示

**検証方法**:

- E2E テストで全シナリオを網羅
- 手動でチャット画面から各シナリオを実行

**参照**: Spec § 6

---

## 2. 仕様レビュー

### CHK201 [P0] - 公開API（ChatService）の実装

- [ ] `sendMessage(text)` が実装されている（FR-001）
- [ ] `stopResponse()` が実装され、応答中断と isLoading=false が動作する
- [ ] `messages` が読み取り専用で公開されている
- [ ] `isLoading` / `error` が公開されている
- [ ] `clearMessages()` が実装されている

**検証方法**:

- `src/hooks/useChatService.ts` が Spec § 4.1 の全メンバーを提供することを確認
- シグネチャが Design § 6 と一致することを確認

**参照**: Spec § 4.1 / Design § 6

---

### CHK202 [P0] - ToolExecutor の実装

- [ ] 読み取りツール5種（getRecentWorkouts / getWorkoutsByExercise / getWorkoutsByDate / getWorkoutSummary / getExercises）が `executeReadTool` から呼び出される
- [ ] 書き込みツール3種（saveWorkout / addExercise / addExerciseToSession）が `executeWriteTool` から呼び出される
- [ ] `isWriteTool(name)` が書き込みツール3種でのみ `true` を返す
- [ ] saveWorkout: 種目ID解決失敗時に `{ success: false, error: 'EXERCISE_NOT_FOUND', data: { missingExercises } }` を返す
- [ ] addExerciseToSession: セッション非アクティブ時に `{ success: false, error: 'SESSION_NOT_ACTIVE' }` を返す

**検証方法**:

- `src/lib/toolExecutor.ts` の switch-case に全ツール分岐があることを確認
- ユニットテスト（tasks.md 5.1）で境界値を網羅

**参照**: Spec § 4.2 / Design § 6, § 8 / tasks.md 2.2, 2.3

---

### CHK203 [P0] - ConfirmationHandler の実装

- [ ] `pendingAction` が確認待ちアクションを表現している
- [ ] `approve()` で書き込み操作が実行され、結果メッセージが追加される
- [ ] `reject()` でキャンセル状態になり、結果メッセージが追加される
- [ ] 確認待ちは同時に1つまでに制限されている（新規発生時に前をキャンセル）

**検証方法**:

- `useChatService` の `approve` / `reject` 実装を確認
- 統合テストで複数 pending の排他を検証

**参照**: Spec § 4.3 / Design § 6 / Spec § 8（制約事項）

---

### CHK204 [P0] - データモデルの整合性

- [ ] `ChatMessage`, `ToolCallResult`, `PendingAction`, `PendingActionStatus` 型が Spec § 4.4 と一致
- [ ] `PendingAction.data` が判別共用体（`actionType` でディスクリミネート）で定義されている
- [ ] `SaveWorkoutData`, `AddExerciseData`, `AddExerciseToSessionData` が T-001 準拠（`any`/`unknown` を使わない）
- [ ] `SummaryPeriod`, `WorkoutSummary`, `ExerciseBreakdown` が定義されている

**検証方法**:

- `src/types/chat.ts` を Spec § 4.4 / Design § 5 と比較
- `npx tsc --noEmit` でコンパイルエラーがないことを確認

**参照**: Spec § 4.4 / Design § 5

---

### CHK205 [P1] - 振る舞い図への準拠

- [ ] 7.1 チャット送受信フローの順序で実装されている（userメッセージ追加 → isLoading=true → API → assistant追加 → isLoading=false）
- [ ] 7.2 Function Calling フローで読み取り/書き込みの分岐が正しい
- [ ] 7.3 書き込み確認フロー: PendingAction 作成 → 確認UI → approve/reject → 結果メッセージ
- [ ] 7.4 APIキー未設定フロー: sendMessage 冒頭で hasApiKey 確認

**検証方法**:

- コードフローを Spec § 7.1〜7.4 のシーケンス図と突き合わせる
- 統合テスト（useChatService）で全フローをカバー

**参照**: Spec § 7

---

### CHK206 [P1] - 制約事項の実装

- [ ] チャットメッセージは localStorage に永続化しない（B-001）
- [ ] 書き込み操作は必ずインラインUIでユーザー確認を経る（B-002, REQ_008）
- [ ] APIキーは settingsStore から取得（独自管理なし）
- [ ] Gemini API エラーは try-catch で捕捉（T-002）
- [ ] TypeScript strict mode 遵守（T-001、any 型不使用）
- [ ] ToolExecutor は WorkoutRepository / ExerciseRepository の既存IFを利用（独自のデータアクセス層なし）

**検証方法**:

- grep で `persist(` の使用有無、`any` 型の使用有無をチェック
- `src/lib/toolExecutor.ts` の import で既存 Repository のみを参照していることを確認

**参照**: Spec § 8

---

## 3. 設計レビュー

### CHK301 [P0] - レイヤー構造の遵守

- [ ] UI Layer は Hook Layer のみを参照している（State/Data を直接参照しない）
- [ ] `useChatService` が唯一のユースケース接点になっている
- [ ] chatStore / geminiClient / toolExecutor は Hook の実装詳細として隠蔽されている
- [ ] 依存方向: UI → Hook → State/Data → External（循環依存なし）

**検証方法**:

- `src/pages/ChatPage.tsx` および `src/components/chat/*.tsx` で `chatStore` 直接参照がないことを grep で確認
- `madge` 等で循環依存がないことを確認

**参照**: Design § 4.1, § 4.2

---

### CHK302 [P0] - 技術スタックの準拠

- [ ] `@google/generative-ai` が導入されている（REST 直接呼び出しなし）
- [ ] `react-markdown` + `remark-gfm` が導入されている
- [ ] Zustand ^5 / Tailwind CSS ^4 / TanStack Router ^1 が使用されている
- [ ] モデルは `gemini-flash-latest` 固定（ユーザー選択UIなし）

**検証方法**:

- `package.json` で依存関係を確認
- `src/lib/geminiClient.ts` で `GEMINI_MODEL = 'gemini-flash-latest'` を確認

**参照**: Design § 3 / § 9.1

---

### CHK303 [P0] - ファイル配置の準拠

- [ ] `src/types/chat.ts` に型定義
- [ ] `src/stores/chatStore.ts` に Zustand ストア
- [ ] `src/lib/geminiClient.ts`, `src/lib/toolDefinitions.ts`, `src/lib/toolExecutor.ts`
- [ ] `src/hooks/useChatService.ts`
- [ ] `src/pages/ChatPage.tsx`
- [ ] `src/components/chat/ChatBubble.tsx`, `ConfirmationBubble.tsx`, `ChatInput.tsx`

**検証方法**:

- Design § 4.2 のテーブルと実ファイル配置を突き合わせる

**参照**: Design § 4.2

---

### CHK304 [P1] - 設計判断のドキュメント化

- [ ] 設計判断（§ 9.1）の表が最新の実装を反映している
- [ ] PRD の h-9 指定 → T-003 違反で h-11 に修正した判断が ConfirmationBubble に適用されている
- [ ] システムプロンプトが geminiClient.ts 内にハードコードされている

**検証方法**:

- Design § 9.1 の表と実装を比較
- `src/components/chat/ConfirmationBubble.tsx` でボタン高さが `h-11` であることを確認

**参照**: Design § 9.1

---

### CHK305 [P1] - 未解決課題のクリア

- [ ] Design § 9.2 に未解決課題が記載されていない（または impl-status が blocked でない）

**検証方法**:

- Design Doc front-matter の `impl-status` を確認
- § 9.2 の内容を確認

**参照**: Design § 9.2

---

## 4. 実装レビュー

### CHK401 [P0] - フォーカス規約の遵守

- [ ] `<ChatInput>` の送信/停止ボタン（raw `<button>`）に `focus-ring` が付与されている
- [ ] `<ConfirmationBubble>` の「実行する」「キャンセル」ボタンは shadcn `<Button>` もしくは `focus-ring` 付き raw `<button>`
- [ ] 新規追加ラベル付きボタンは shadcn `<Button>` を第一選択（CLAUDE.md 規約）

**検証方法**:

- `src/components/chat/**/*.tsx` で `<button` を grep し、`focus-ring` または `<Button>` になっているか確認

**参照**: CLAUDE.md「キーボードフォーカス規約」「shadcn `<Button>` 採用方針」

---

### CHK402 [P0] - エラーハンドリング

- [ ] 全 Gemini API 呼び出しが try-catch でラップされている
- [ ] `AbortError` は stopResponse の正常中断として無視される（error 表示なし）
- [ ] `getErrorMessage` で認証・レート制限・ネットワーク・その他の判別がされている
- [ ] 各エラーメッセージが日本語で、ユーザーアクションを促す文言になっている

**検証方法**:

- `src/lib/geminiClient.ts` の `getErrorMessage` 実装を確認
- `src/hooks/useChatService.ts` の catch 節で AbortError 判定を確認

**参照**: Design § 7（エラーメッセージ設計）

---

### CHK403 [P0] - Privacy-by-Design の実装

- [ ] `chatStore` で Zustand の `persist` ミドルウェアが使用されていない
- [ ] ページリロードでチャット履歴がクリアされる
- [ ] localStorage にチャット関連のキーが保存されていない

**検証方法**:

- `src/stores/chatStore.ts` で `persist` を grep し未使用を確認
- ブラウザ DevTools → Application → Local Storage でチャット関連キーが存在しないことを確認

**参照**: Spec § 8（B-001）/ Design § 5（Note）

---

### CHK404 [P0] - 書き込み操作の安全パス

- [ ] 書き込み操作は必ず `PendingAction` 経由で実行される（直接実行パスなし）
- [ ] saveWorkout / addExercise / addExerciseToSession すべてが approve 後のみ実行される
- [ ] 新たな書き込み操作発生時に前の pending が自動キャンセルされる

**検証方法**:

- `executeWriteTool` の呼び出し箇所を grep し、`approve` 経由のみであることを確認
- 統合テストで「pending 中に別の pending を発生」→ 前がキャンセルされることを検証

**参照**: Spec § 8（B-002）/ Design § 6

---

### CHK405 [P1] - コード品質

- [ ] ESLint / TypeScript のエラー・警告がゼロ
- [ ] `any` 型の使用がない（T-001）
- [ ] `// TODO` / `// FIXME` が追跡可能な状態（または削除済み）
- [ ] 関数が単一責務（sendMessage の読み取り/書き込み分岐はヘルパー関数に分割可能か検討）

**検証方法**:

- `npm run lint` / `npx tsc --noEmit` が成功
- 静的解析ツールの結果を確認

**参照**: CLAUDE.md / T-001

---

### CHK406 [P1] - UIスペックの遵守

- [ ] ユーザーメッセージ: 右寄せ `bg-black text-white` / `rounded-[18px] rounded-br-[4px]` / max-width 75%
- [ ] AI返答: 左寄せ `bg-white border-zinc-100 shadow-soft` / `rounded-[18px] rounded-bl-[4px]` / max-width 88%
- [ ] ChatInput が BottomNav の上に固定（`bottom: 96px`）
- [ ] ConfirmationBubble のボタン: h-11、`bg-zinc-100` キャンセル / `bg-black` 実行、`flex gap-2`、各 `flex-1`
- [ ] Markdown（見出し・リスト・テーブル）が正しくレンダリングされる

**検証方法**:

- Playwright（`mcp__plugin_playwright_playwright__browser_snapshot`）で実画面を確認
- デザインシステム（`.sdd/design-system.html` FRAME4）と照合

**参照**: PRD § 3 FR_011, REQ_008 / Design § 4.2

---

## 5. テストレビュー

### CHK501 [P0] - ユニットテストカバレッジ

- [ ] `toolExecutor.test.ts`: 全8ツールのディスパッチ + isWriteTool + 境界値
- [ ] `chatStore.test.ts`: addMessage / updatePendingAction / clearMessages / setLoading / setError
- [ ] `geminiClient.test.ts`: 正常応答 / Function Call / エラー判別 / AbortSignal / 履歴50件制限
- [ ] `getErrorMessage` の全エラーパターンが網羅されている

**検証方法**:

```bash
npm run test
npm run test -- --coverage
```

**目標**: ビジネスロジック（lib/ stores/ hooks/）のラインカバレッジ ≥ 80%

**参照**: Design § 8 / tasks.md 5.1〜5.3

---

### CHK502 [P0] - 統合テスト（useChatService）

- [ ] メッセージ送信 → AI応答 → メッセージ追加
- [ ] 読み取りツールの自律実行フロー
- [ ] 書き込みツール confirm → approve → 実行 → 結果
- [ ] 書き込みツール confirm → reject → キャンセル
- [ ] APIキー未設定時のエラー表示
- [ ] stopResponse による応答中断 + 即座に新メッセージ送信可能

**検証方法**:

- `src/hooks/__tests__/useChatService.test.ts` で Design § 8 の統合テスト仕様を網羅

**参照**: Design § 8 / tasks.md 5.4

---

### CHK503 [P0] - コンポーネントテスト

- [ ] `ChatBubble.test.tsx`: user/assistant バブル + マークダウンレンダリング
- [ ] `ConfirmationBubble.test.tsx`: approve/reject クリックの挙動 + status による非活性化
- [ ] `ChatInput.test.tsx`: 送信 / Enter / Shift+Enter / ローディング中の停止ボタン

**検証方法**:

- Vitest + Testing Library で主要インタラクションをカバー

**参照**: Design § 8 / tasks.md 5.5

---

### CHK504 [P1] - E2Eテスト

- [ ] `/chat` 画面: メッセージ送信 → AI応答表示（ゴールデンパス）
- [ ] `/chat` 画面: 書き込み確認 → 承認 → 結果表示（確認フロー）

**検証方法**:

- Playwright で E2E テストを実行
- Gemini API は MSW 等でモック

**参照**: Design § 8

---

### CHK505 [P1] - エッジケーステスト

- [ ] チャット履歴50件超過時、51件目以降が Gemini API 送信対象外になる（UI表示は維持）
- [ ] 連続送信でのレースコンディション（pending 中に次の send）
- [ ] saveWorkout 複数種目のうち一部のみ未登録のケース
- [ ] stopResponse 後の状態整合性（部分 assistant メッセージの破棄）

**検証方法**:

- 境界値・競合ケースのユニットテスト / 統合テストを追加

**参照**: Spec § 8

---

## 6. ドキュメントレビュー

### CHK601 [P1] - コードコメント

- [ ] 複雑なロジック（sendMessage の読み取り/書き込み分岐、pending の自動キャンセル）に必要最小限のコメント
- [ ] システムプロンプトの意図が読み取れる
- [ ] CLAUDE.md のコメント方針（WHY を書く、WHAT は書かない）に従っている

**検証方法**:

- `src/lib/geminiClient.ts`, `src/hooks/useChatService.ts` のコメントをレビュー

**参照**: CLAUDE.md

---

### CHK602 [P1] - 設計書の更新

- [ ] Design Doc § 1 実装ステータス表が全て 🟢 実装済みに更新されている
- [ ] Design Doc front-matter `impl-status` が `"implemented"` に更新されている
- [ ] PRD との整合性（PRD整合性確認セクション）が維持されている
- [ ] `updated:` 日付が最新

**検証方法**:

- tasks.md 6.1 の完了を確認
- `/check-spec ai-chat` で整合性チェック

**参照**: Design § 1 / tasks.md 6.1

---

## 7. セキュリティレビュー

### CHK701 [P0] - APIキーの保護

- [ ] APIキーがソースコードにハードコードされていない
- [ ] APIキーが Gemini API エンドポイント（`generativelanguage.googleapis.com`）以外に送信されていない
- [ ] APIキーがログ・エラーメッセージ・分析イベントに混入していない
- [ ] APIキーは settingsStore から取得し、geminiClient 内でのみ使用

**検証方法**:

- `git grep -i "AIza"` 等でキーがリポジトリに含まれていないことを確認
- ブラウザ DevTools ネットワークタブで送信先を監査
- console.log 等にキーが出力されないことを確認

**参照**: Spec NFR-002 / Design § 7

---

### CHK702 [P0] - チャット内容の保護

- [ ] チャット履歴が Gemini API 以外に送信されていない
- [ ] localStorage / sessionStorage / IndexedDB にチャット履歴が保存されていない
- [ ] 分析・ログツール等にチャット内容が転送されていない

**検証方法**:

- ネットワークタブで通信先を監査
- ストレージを確認

**参照**: Spec NFR-001 / Design § 5（Note）

---

### CHK703 [P0] - XSS対策（Markdownレンダリング）

- [ ] `dangerouslySetInnerHTML` を使用せず `react-markdown` を使用している
- [ ] AI応答内のスクリプト / iframe / onerror 等が無害化される
- [ ] リンク（`<a>`）に `rel="noopener noreferrer"` が付与されている、または外部リンクを制限

**検証方法**:

- `src/components/chat/ChatBubble.tsx` で `dangerouslySetInnerHTML` がないことを grep
- `<script>alert(1)</script>` を含む応答で XSS が発火しないことをテスト

**参照**: Design § 9.1 / CONSTITUTION セキュリティ標準

---

### CHK704 [P0] - 書き込み操作の認可

- [ ] 全ての書き込み操作が PendingAction 経由でユーザー承認を経ている（B-002）
- [ ] approve 前に executeWriteTool が呼ばれるパスがない
- [ ] reject 後に書き込みが実行されない

**検証方法**:

- `executeWriteTool` の呼び出し箇所を grep
- 統合テストで approve なしの書き込みが拒否されることを検証

**参照**: Spec § 8（B-002, REQ_008）/ Design § 6

---

## 8. パフォーマンスレビュー

### CHK801 [P0] - API送信履歴の制限

- [ ] `MAX_HISTORY_MESSAGES = 50` が適用されている
- [ ] 50件超過時、古いメッセージは API 送信対象外（UI は維持）
- [ ] 履歴スライス（`history.slice(-50)`）が sendMessage / sendFunctionResult の両方で適用されている

**検証方法**:

- `src/lib/geminiClient.ts` で定数定義と使用箇所を確認
- ユニットテスト（CHK501）で 50件制限を検証

**参照**: Spec NFR-005 / Design § 6

---

### CHK802 [P1] - レンダリングパフォーマンス

- [ ] 長いチャット履歴でスクロールがカクつかない（必要に応じて仮想化）
- [ ] マークダウンレンダリングが毎レンダーで再計算されない（memo 化）
- [ ] isLoading 中の入力バー操作がスムーズ

**検証方法**:

- 100件以上のメッセージで動作確認
- React DevTools Profiler で再レンダー頻度を確認

**参照**: （設計判断）

---

## 9. デプロイレビュー

### CHK901 [P0] - ルート登録と環境

- [ ] `/chat` ルートが TanStack Router に登録されている（tasks.md 4.6）
- [ ] ナビゲーション（BottomNav）からチャット画面に遷移できる
- [ ] ビルド（`npm run build`）がエラーなく完了する
- [ ] 本番ビルドで Gemini SDK が正しくバンドルされている

**検証方法**:

- `npm run build` → エラーなし
- `npm run preview` で `/chat` にアクセス

**参照**: tasks.md 4.6

---

### CHK902 [P1] - 依存関係の検証

- [ ] `@google/generative-ai`, `react-markdown`, `remark-gfm` のバージョンが固定されている
- [ ] ライセンス互換性に問題がない
- [ ] `npm audit` で Critical な脆弱性がない

**検証方法**:

- `package.json` / `package-lock.json` を確認
- `npm audit` を実行

**参照**: Design § 3 / tasks.md 1.3, 4.2

---

## 完了基準

### PR作成前チェックリスト

すべてのP0項目が完了している必要があります:

- [ ] すべてのP0項目（22件）がチェック済み
- [ ] すべてのテストが合格している（`npm run test`, `npm run build`）
- [ ] `/check-spec ai-chat` で仕様との整合性が検証されている
- [ ] コードレビュー準備完了

### マージ前チェックリスト

すべてのP0とP1項目が完了している必要があります:

- [ ] すべてのP0項目（22件）がチェック済み
- [ ] すべてのP1項目（13件）がチェック済み
- [ ] コードレビュー承認済み
- [ ] CI/CD パイプライン グリーン
- [ ] マージ準備完了

### リリース前チェックリスト

- [ ] 手動 E2E テストで全シナリオ（シナリオ1〜7, 3a, 5a）を確認
- [ ] APIキー未設定 → 設定 → チャット動作 を確認
- [ ] Design Doc `impl-status` が `implemented` に更新（tasks.md 6.1）
- [ ] 本番デプロイ準備完了

---

## Notes

- 本チェックリストは PRD / Spec / Design / tasks.md から導出されており、勝手な要件追加は行っていない
- 書き込み操作の安全性（B-002）が最大リスクポイントなので、CHK404 / CHK704 を重点確認
- Privacy-by-Design（B-001）の検証は CHK403 / CHK702 で二重にチェック
- 仕様変更があった場合は `/check-spec ai-chat` で整合性を再確認し、本チェックリストを更新すること

---

## 参照ドキュメント

- PRD: [index.md](../../requirement/ai-chat/index.md)
- 抽象仕様書: [index_spec.md](../../specification/ai-chat/index_spec.md)
- 技術設計書: [index_design.md](../../specification/ai-chat/index_design.md)
- タスク分解: [tasks.md](./tasks.md)
- プロジェクト原則: [CONSTITUTION.md](../../CONSTITUTION.md)
- UI規約: [CLAUDE.md](../../../CLAUDE.md)（focus-visible / shadcn Button）
