# ADR: api-key

## localStorage を直接操作（Zustand persist ミドルウェア不使用）

- **決定**: APIKey の永続化に Zustand の `persist` ミドルウェアを使わず、localStorage の `setItem`/`getItem`/`removeItem` を直接使用する
- **理由**: APIKey は単一の文字列値。persist ミドルウェアの JSON シリアライズ/デシリアライズのオーバーヘッドは不要。

## ストア名を `settingsStore`（`apiKeyStore` ではない）

- **決定**: APIKey を管理するストアを `settingsStore` と命名する
- **理由**: APIKey は設定ドメインに属する。将来的な設定項目（テーマ・通知等）の追加も同じストアに収容できる。

## APIKey の初期化を useEffect で行う（モジュールロード時ではない）

- **決定**: localStorage からの APIKey 読み込みをストア生成時（モジュールロード）ではなく、ルートレイアウトの `useEffect` で実行する
- **理由**: ストア生成時（モジュールロード時）に localStorage にアクセスすると SSR 互換性の問題が生じる。`useEffect` によりブラウザ環境であることが保証される。

## 保存成功時はストア更新前に localStorage へ書き込む

- **決定**: 保存成功時は「localStorage に書き込み → ストア状態を更新」の順序で実行する。localStorage 失敗時はストア状態のみ更新する（楽観的更新）。
- **理由**: 成功時にストア状態が永続ストレージの内容を正確に反映する。失敗時はストア更新を優先して UX を維持する。

## モデル一覧は決め打ちせず ListModels API から動的取得（FR_011）

- **決定**: 選択可能な Gemini モデルをコード内のリストで固定せず、Gemini ListModels エンドポイント（`/v1beta/models`）を APIキーで叩いて取得する。`generateContent` をサポートするモデルのみ一覧化する。取得は TanStack Query（`useGeminiModels`）でキャッシュし、APIキーが設定されている間のみ有効化する。
- **理由**: Gemini のモデルは頻繁に更新されるため、固定リストは陳腐化する。動的取得により最新のサポートモデルを常に提示できる。`generateContent` フィルタで埋め込み専用モデル等を除外する。

## 選択モデルは settingsStore に持ち、APIキーと同じ直接 localStorage 方式で永続化

- **決定**: 選択中のモデル id を `settingsStore` の `model` として保持し、`gymini:gemini-model` キーで localStorage に直接保存する（persist ミドルウェア不使用）。既定値・読み込み失敗時は `gemini-3-flash-preview`。
- **理由**: APIキーと同じ設定ドメイン・同じ永続化方針に揃える。単一文字列のため persist のオーバーヘッドは不要。
