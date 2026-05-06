---
paths:
  - "src/**/*.tsx"
---

# デザインシステム規約

UI コンポーネント（`.tsx`）の新規作成・修正時は `docs/design/tokens.md` を参照し、`gym-*` トークンを使用する。

**例外**: `src/components/ui/` 配下の shadcn コンポーネントは okLCH 変数を使うため対象外。

## リファレンス

| リファレンス | 内容 |
|:---|:---|
| [tokens.md](../../docs/design/tokens.md) | カラー・シャドウ・ボーダーラジウス・フォントトークン、禁止クラス一覧 |
| [components.md](../../docs/design/components.md) | 索引（focus / button / input へのリンク）|
| [focus.md](../../docs/design/focus.md) | フォーカスリング規約（focus-ring ユーティリティ）|
| [button.md](../../docs/design/button.md) | Button / IconButton / 生の button 使い分け |
| [input.md](../../docs/design/input.md) | Input（prefix/suffix）/ select wrapper |
