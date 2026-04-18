---
id: "impl-ai-chat"
title: "AIチャット × Function Calling 実装ログ"
type: "impl"
status: "completed"
created: "2026-04-18"
updated: "2026-04-19"
completed: "2026-04-19"
depends-on: ["design-ai-chat"]
ticket: "ai-chat"
tags: ["ai", "chat", "function-calling", "gemini", "phase-3"]
implementer: "SakumaTakuya"
---

# AIチャット × Function Calling 実装ログ

## サマリー

Gemini Function Calling ベースの AI コーチ機能を TDD で実装。全 6 Phase を順次進行し、
Phase 1-5 は TDD による先行テストでレッドグリーン回帰、Phase 6 で Spec/Design/Tasks を
`implemented` に更新した。

| 指標 | 値 |
|:---|:---|
| 追加ファイル | 17 |
| 追加テストケース | 72（chat 関連） |
| 総テスト | 331 全 PASS |
| typecheck / lint / build | すべて pass |

## Phase ごとの完了状況

| Phase | 内容 | 完了日 | 対応コミット |
|:---|:---|:---|:---|
| 1 | 基盤（型定義・chatStore・Gemini SDK 導入） | 2026-04-18 | cdb86f2 |
| 2 | コア実装（toolDefinitions / toolExecutor / geminiClient） | 2026-04-18 | 3226617 |
| 3 | 統合（useChatService） | 2026-04-18 | 0c82340 |
| 4 | UI 実装（ChatBubble / ConfirmationBubble / ChatInput / AIChatPage） | 2026-04-19 | b152de1 |
| 5 | テスト充実（AIChatPage スモーク + E2E 見出し修正） | 2026-04-19 | b84314f |
| 6 | Design Doc status 更新 | 2026-04-19 | (本コミット) |

## 要求カバレッジ

| 要求ID | 要件 | 状態 | 対応実装 |
|:---|:---|:---|:---|
| FR-001 | Gemini APIを用いたチャット会話 | ✅ | geminiClient / useChatService / AIChatPage |
| FR-002 | Function Calling によるツール自律呼び出し | ✅ | useChatService.sendMessage（読み取り並列実行） |
| FR-003〜FR-006 | 読み取りツール4種（最新/種目/日付/集計） | ✅ | toolExecutor.executeReadTool |
| FR-007 | ワークアウト保存（確認必須） | ✅ | PendingAction → approve → saveWorkout |
| FR-008 | 種目一覧取得 | ✅ | toolExecutor.executeReadTool（getExercises） |
| FR-009 | 種目追加（確認必須） | ✅ | PendingAction → approve → addExercise |
| FR-010 | セッションへの種目追加（確認必須） | ✅ | PendingAction → approve → addExerciseToSession |
| FR-011 | インラインUIでの書き込み確認 | ✅ | ConfirmationBubble + useChatService.approve/reject |
| NFR-001 | チャット内容のセキュリティ | ✅ | chatStore は persist 未使用 |
| NFR-002 | APIキーのセキュリティ | ✅ | settingsStore から取得し geminiClient 内のみで使用 |
| NFR-003 | Gemini API エラー耐性 | ✅ | getErrorMessage + sendMessage の try/catch |
| NFR-004 | APIキー未設定時のガイド | ✅ | AIChatPage + sendMessage 冒頭チェック |
| NFR-005 | チャット履歴 50 件制限 | ✅ | geminiClient.generate で `slice(-50)` |

## 設計判断で採用した変更点

- **geminiClient を `generate(contents)` 単一メソッドに統一**: Function Calling の往復（model の
  functionCall + user の functionResponse）を hook 側で組み立てることで、テスト容易性と境界の
  明確化を両立。当初の案（sendMessage / sendFunctionResult 2 メソッド）は functionCall 部分の
  context を失いやすい欠点があったため撤回。
- **チャットバブルのマークダウン**: Tailwind typography プラグインは未導入のため、
  `src/index.css` に `@utility chat-markdown` を新設し必要最小限のスタイルを定義。
- **aria-label ベースの UI テスト**: ChatInput / ChatPage のテストで `<Link>` をモック化し、
  TanStack Router provider 無しでの単体レンダリングを可能にした。
- **scrollIntoView の jsdom 互換性**: AIChatPage の自動スクロール副作用を `typeof` ガードで
  保護し、テスト環境でも落ちないようにした。

## 手動検証が必要な項目

- [ ] 実 Gemini API（BYOK）でのチャット動作確認
- [ ] saveWorkout フローで未登録種目 → 種目登録提案 → 再記録のシナリオ 3a
- [ ] addExerciseToSession フローで SESSION_NOT_ACTIVE → セッション開始提案のシナリオ 5a
- [ ] 50 件超のチャット履歴で UI 表示は維持・API 送信は制限されることの確認
- [ ] モバイル実機でのキーボード・タップターゲット・バブル表示

## 参照

- 抽象仕様書: [index_spec.md](../../specification/ai-chat/index_spec.md)
- 技術設計書: [index_design.md](../../specification/ai-chat/index_design.md)
- PRD: [index.md](../../requirement/ai-chat/index.md)
- 品質チェックリスト: [checklist.md](./checklist.md)
