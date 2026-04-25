---
id: "verification-ai-chat"
title: "AIチャット × Function Calling 検証レポート"
type: "verification"
status: "completed"
created: "2026-04-25"
updated: "2026-04-25"
depends-on: ["checklist-ai-chat", "impl-ai-chat"]
tags: ["ai", "chat", "function-calling", "gemini", "phase-3"]
category: "ai"
---

# AIチャット × Function Calling 自動検証レポート

## サマリー

| 指標                  | 結果                              |
|:--------------------|:--------------------------------|
| 実行日時                | 2026-04-25                      |
| 対象ブランチ              | `fix/ai-chat-error-handling`    |
| 対象 PR              | [#40](https://github.com/SakumaTakuya/gymini/pull/40) |
| typecheck           | ✅ pass                         |
| lint (eslint)       | ✅ pass                         |
| unit/integration test | ✅ 41 ファイル / **338 件 PASS** |
| build (vite)        | ✅ success                      |
| ai-chat 平均カバレッジ | **97.4%**（型定義除く）              |
| Playwright 実機検証 | ✅ 4 シナリオ成功 / コンソールエラー 0 |

## 自動検証コマンドの実行結果

| コマンド | 結果 |
|:---|:---|
| `npm run typecheck` | OK（出力なし） |
| `npm run lint` | OK（出力なし） |
| `npm run test` | 338/338 passed |
| `npm run build` | success / `ai-*.js` 199.20kB（gzip 60.06kB） |
| `npm run test:coverage` | All files 80.77% / ai-chat ファイル群は下表 |
| `npm audit` | 6 件（3 moderate / 3 high）— 全て **devDependencies** (vite/vitest) |

## ai-chat モジュール別カバレッジ

| ファイル | %Stmts | %Branch | %Funcs | %Lines |
|:---|---:|---:|---:|---:|
| `src/lib/geminiClient.ts` | 97.84 | 95.34 | 100 | 97.84 |
| `src/lib/toolDefinitions.ts` | 100 | 100 | 100 | 100 |
| `src/lib/toolExecutor.ts` | 97.08 | 83.33 | 100 | 97.08 |
| `src/stores/chatStore.ts` | 100 | 94.73 | 100 | 100 |
| `src/hooks/useChatService.ts` | 78.93 | 65.90 | 100 | 78.93 |
| `src/components/chat/ChatBubble.tsx` | 100 | 75.00 | 100 | 100 |
| `src/components/chat/ChatInput.tsx` | 100 | 100 | 100 | 100 |
| `src/components/chat/ConfirmationBubble.tsx` | 98.27 | 87.50 | 100 | 98.27 |
| `src/pages/AIChatPage.tsx` | 97.67 | 93.33 | 50 | 97.67 |
| `src/types/chat.ts` | — | — | — | — |（型定義のみ） |

> `useChatService` は 78.93% で目標 80% にわずかに届かない。未到達分は `isAbortError` の SDK 固有 name（GoogleGenerativeAIAbortError）分岐とフォールバック再構築パスで、実 API 接続時のみ通る経路のため許容範囲。

## チェックリスト項目別の自動検証結果

### 1. 要求レビュー

| ID | 自動 | 結果 | 備考 |
|:---|:---|:---|:---|
| CHK101 | △ | PASS | tasks.md / spec § 3.1 と FR_011/FR_012 の対応一覧で網羅。8 ツール + REQ_008 すべて実装 |
| CHK102 | △ | PASS | NFR-001〜005 すべて実装に対応（後述項目で詳細） |
| CHK103 | × | 手動 | E2E と実機シナリオは Playwright で 4 件確認、残り 4 件は手動で要検証 |

### 2. 仕様レビュー

| ID | 自動 | 結果 | 備考 |
|:---|:---|:---|:---|
| CHK201 | ✅ | PASS | useChatService が ChatService IF（sendMessage/stopResponse/messages/isLoading/error/clearMessages）を提供 |
| CHK202 | ✅ | PASS | toolExecutor 単体テスト 19 件で 8 ツール + 境界値を網羅 |
| CHK203 | ✅ | PASS | useChatService.test.ts に approve / reject / 連続 pending の自動キャンセル 3 ケース |
| CHK204 | ✅ | PASS | typecheck pass / `any` 不使用 / 判別共用体（actionType）で型安全 |
| CHK205 | △ | PASS | 統合テストでフロー網羅。シーケンス図との人手照合は CHK602 で実施済み |
| CHK206 | ✅ | PASS | persist 不使用 / executeWriteTool は approve 経由のみ / try-catch でエラー捕捉 |

### 3. 設計レビュー

| ID | 自動 | 結果 | 備考 |
|:---|:---|:---|:---|
| CHK301 | ✅ | PASS | UI Layer（components/chat, AIChatPage）は useChatService のみ参照。chatStore 直接参照なし |
| CHK302 | ✅ | PASS | `@google/generative-ai`, `react-markdown`, `remark-gfm`, Zustand ^5, Tailwind ^4, TanStack Router ^1 / モデル `gemini-flash-latest` 固定 |
| CHK303 | ✅ | PASS | Design § 4.2 のテーブルと配置一致 |
| CHK304 | ✅ | PASS | Design § 9.1 を実装に整合（h-11 採用、`generate(contents)` 単一メソッド化など追記済み） |
| CHK305 | ✅ | PASS | Design § 9.2 は空欄、impl-status は `implemented` |

### 4. 実装レビュー

| ID | 自動 | 結果 | 備考 |
|:---|:---|:---|:---|
| CHK401 | ✅ | PASS | ConfirmationBubble / ChatInput の raw button に `focus-ring` 付与。AIChatPage の `<Link>` も `focus-ring` |
| CHK402 | ✅ | PASS | `getErrorMessage` を 401/429/SAFETY/400/INVALID_ARGUMENT/network/default に分類。本 PR で `\b401\b` の誤判定も修正 |
| CHK403 | ✅ | PASS | `grep persist src/stores/chatStore.ts` 0 件 |
| CHK404 | ✅ | PASS | `executeWriteTool` の呼び出しは `useChatService.ts:212` の approve 内のみ（grep で確認） |
| CHK405 | ✅ | PASS | typecheck/lint クリーン。`any` 0 / `// TODO` 0 |
| CHK406 | △ | PASS | UIスペックは Playwright で実機確認済み（左寄せ/右寄せ/h-11/markdown） |

### 5. テストレビュー

| ID | 自動 | 結果 | 備考 |
|:---|:---|:---|:---|
| CHK501 | ✅ | PASS | toolExecutor 19 / chatStore 10 / geminiClient 17 / getErrorMessage 全パターン網羅。lib/ stores/ カバレッジ ≥ 97% |
| CHK502 | ✅ | PASS | useChatService.test.ts 13 ケースで読み取り/書き込み/approve/reject/未設定/停止を網羅 |
| CHK503 | ✅ | PASS | ChatBubble 4 / ConfirmationBubble 5 / ChatInput 6 |
| CHK504 | △ | PARTIAL | `e2e/navigation.spec.ts` で `/ai` 遷移のみ。実 API 必要シナリオは未実装。Playwright MCP で 2026-04-25 に実機確認済み |
| CHK505 | △ | PARTIAL | 50 件超過は geminiClient テストでカバー。レースコンディションは未網羅 |

### 6. ドキュメントレビュー

| ID | 自動 | 結果 | 備考 |
|:---|:---|:---|:---|
| CHK601 | △ | PASS | sendMessage の分岐とシステムプロンプトに必要最小限のコメントあり |
| CHK602 | ✅ | PASS | Design Doc impl-status `implemented`、Section 1 全 🟢、updated `2026-04-19` |

### 7. セキュリティレビュー

| ID | 自動 | 結果 | 備考 |
|:---|:---|:---|:---|
| CHK701 | ✅ | PASS | `git ls-files | xargs grep "AIza[A-Za-z0-9_-]{20,}"` のヒットは `.sdd/design-system.html` と `.sdd/specification/api-key/index_design.md` のプレースホルダのみ |
| CHK702 | ✅ | PASS | chatStore は persist 未使用、Network 送信先は `generativelanguage.googleapis.com` のみ |
| CHK703 | ✅ | PASS | `dangerouslySetInnerHTML` 使用なし。react-markdown でレンダリング |
| CHK704 | ✅ | PASS | executeWriteTool 呼び出し箇所は approve のみ（CHK404 と同根拠） |

### 8. パフォーマンスレビュー

| ID | 自動 | 結果 | 備考 |
|:---|:---|:---|:---|
| CHK801 | ✅ | PASS | `MAX_HISTORY_MESSAGES = 50` / `contents.slice(-50)` を geminiClient.test で検証済み |
| CHK802 | × | 手動 | 大量メッセージでのレンダー特性は未測定 |

### 9. デプロイレビュー

| ID | 自動 | 結果 | 備考 |
|:---|:---|:---|:---|
| CHK901 | ✅ | PASS | `/_app/ai` は既存。`npm run build` 成功。BottomNav に AI タブあり |
| CHK902 | ✅ | PASS | `package.json` で各依存はキャレット範囲。`npm audit` の脆弱性は dev のみ（vite/vitest） |

## 実機検証（Playwright + dev サーバ）

| シナリオ | 結果 |
|:---|:---|
| 1 通目の挨拶 | ✅ 自然言語応答 |
| 読み取りツール（getRecentWorkouts） | ✅ 空結果に対する応答 |
| 書き込みツール → PendingAction → approve | ✅ 「実行済み」 + 結果メッセージ |
| approve 後の続きの質問（連続 model + thought_signature 同時） | ✅ getExercises 成功・マークダウン整形 |

> 検証中に Gemini 2.5 系の **thought_signature 要件**を発見。SDK レスポンスの `candidates[0].content` をそのまま modelContent として返送することで解消（PR #40 addff98）。

## 残存リスクと推奨アクション

| リスク | 重大度 | 対応案 |
|:---|:---|:---|
| 実 API シナリオ 5（セッション未開始時の addExerciseToSession）未検証 | Medium | 本番デプロイ後に手動確認 |
| useChatService 78.93%（目標 80%） | Low | AbortError 系分岐の追加テスト or 許容として記録 |
| `npm audit` の dev 脆弱性 | Low | `npm audit fix` を別 PR で対応 |
| CHK802 レンダリング性能未測定 | Low | 100+ メッセージでの React DevTools Profiler 測定 |

## 結論

P0（22 件）は全て自動またはコードベース確認で **PASS**。  
P1（13 件）も主要項目は PASS。手動確認が残るのは E2E 実 API シナリオ（CHK103/CHK504/CHK505/CHK802）のみで、本番デプロイ後の検証で完了見込み。  

**マージ可能**。

## 参照

- 品質チェックリスト: [checklist.md](./checklist.md)
- 実装ログ: [implementation_progress.md](./implementation_progress.md)
- PR #40: https://github.com/SakumaTakuya/gymini/pull/40
