# ADR: ai-chat

## Gemini SDK を直接使用（@google/generative-ai）

- **決定**: REST API ではなく `@google/generative-ai` SDK を採用
- **理由**: Function Calling のパラメータ構築と型定義が SDK で完結し、実装コストを削減できる

## チャット履歴を localStorage に永続化しない

- **決定**: チャットメッセージを Zustand のメモリのみに保持（localStorage に保存しない）
- **理由**: B-001（Privacy-by-Design）に基づく不要データの残留防止。チャット履歴はセッション単位での有効性で十分。
- **トレードオフ**: ページリロードでチャット履歴が消える

## 書き込み確認 UI をインラインに表示

- **決定**: Function Calling の書き込み操作確認を、モーダルではなくチャットバブル内のインラインボタンで表示
- **理由**: モバイルでのコンテキストスイッチを最小化する。PRD REQ_008 の仕様。

## Gemini モデルを `gemini-flash-latest` に固定

- **決定**: ユーザーによるモデル選択を提供せず、`gemini-flash-latest` に固定
- **理由**: 速度・コスト・Function Calling サポートのバランスが最適。

## チャット履歴の API 送信を 50 件に制限

- **決定**: トークン数ではなく、メッセージ件数（50件）で API 送信量を制限
- **理由**: シンプルな実装で通常会話のコンテキストとして十分。トークンオーバーフローを防止できる。

## Hook が `contents` 配列を組み立てる（`generate(contents)` パターン）

- **決定**: Hook が `contents` 配列（`modelContent` 保持を含む）を組み立ててから `generate()` に渡す
- **理由**: SDK 結合を Hook 層で吸収する。Gemini 2.5 の `thoughtSignature` を含む `modelContent` の保持など、Function Calling の往復コンテキスト管理は Hook が担うべき責務。

## 同ロールのメッセージをマージし、先頭の model エントリを除去

- **決定**: `ChatMessage` → `Content` 変換時に、連続する同ロールのメッセージをマージし、先頭が `model` ロールの場合はそれを除去する
- **理由**: Gemini API は user/model の厳格な交互入力を要求する。`approve`/`reject` のワークフローでは連続する `model` エントリが生成される場合がある。
