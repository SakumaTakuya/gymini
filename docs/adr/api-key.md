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
