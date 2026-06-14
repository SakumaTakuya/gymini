---
paths:
  - "src/**/*.tsx"
---

# デザインシステム規約

UI コンポーネント（`.tsx`）の新規作成・修正時は `gym-*` トークンを使用する。詳細は @docs/design/tokens.md を参照（索引は @docs/design/components.md）。

**余白**: 画面端の水平インセットは `px-page`/`mx-page`（16px）に統一し、生の `px-4`/`px-5`/`px-6`・`mx-4` を直書きしない。`rounded-[24px]` のコンテンツカードは `GymCard` を使い、`p-4` 等のカード内 padding を直書きしない。縦リズムは tokens.md の少数ステップに収束させる。

**例外**: `src/components/ui/` 配下の shadcn コンポーネントは okLCH 変数を使うため対象外。
