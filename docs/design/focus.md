# フォーカスリング規約（focus-visible）

> CLAUDE.md T-003 / T-004 準拠。インタラクティブ要素を実装する際に参照すること。

T-003（Mobile-First UI）に準拠しつつ、キーボード操作を行うユーザー向けにフォーカスリングを必須とします。

**適用対象**: shadcn `<Button>` / `<IconButton>` 以外の全インタラクティブ要素（生の `<button>`, `<a>`, `<input>`, `role="button"` div 等）。

**ルール**:

- 生の `<button>`（`type="button"` 等）には `focus-ring` ユーティリティを必ず付与する
- `focus-ring` は `src/index.css` で `@utility focus-ring { ... }` として定義され、展開後は以下と等価:

    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-gym-black
    focus-visible:ring-offset-2
    focus-visible:ring-offset-white

- shadcn `<Button>` / `<IconButton>`（`src/components/ui/`）は既にフォーカススタイルを内包しているため、追加指定は不要
- `<Input>` は `focus-ring`（単体）または `focus-within:ring-*`（prefix/suffix あり）を内包済みのため追加不要
- 非インタラクティブ要素（`<div onClick>` 等）は原則避ける。やむを得ず使う場合は `role="button"` と `tabIndex={0}` 付与のうえ `focus-ring` を適用する

**適用例**:

```tsx
// <a> タグ（TanStack <Link> 以外でアンカーを書く場合）
<a href="..." className="focus-ring rounded-md text-gym-black underline">
  利用規約
</a>

// div を操作可能要素として使う場合（原則非推奨。やむを得ない場合のみ）
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  className="focus-ring rounded-xl px-4 py-3 ..."
>
  ...
</div>
```

生の `<button>` や `<Input>` suffix 内ボタンの例は [button.md](button.md) / [input.md](input.md) を参照。

**理由**:

- マウスクリック時のフォーカスリング表示は視覚ノイズになるため `focus-visible` を採用し、キーボード操作時のみ表示する
- `gym-black` リング + `ring-offset-white` は設計系のモノクロ基調と整合し、どのカード/ボタン色の上でも 4.5:1 のコントラストを確保
