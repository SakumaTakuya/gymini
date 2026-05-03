# コンポーネント規約

> CLAUDE.md T-003 / T-004 準拠。新規コンポーネント実装時に参照すること。
> カラー・シャドウ・タイポグラフィは [tokens.md](tokens.md) を参照。

## キーボードフォーカス規約（focus-visible）

T-003（Mobile-First UI）に準拠しつつ、キーボード操作を行うユーザー向けにフォーカスリングを必須とします。

**適用対象**: `<button>`, `<a>`, `Link`, shadcn `<Button>` を除く全てのインタラクティブな要素。

**ルール**:

- 生の `<button>`（`type="button"` 等）には `focus-ring` ユーティリティを必ず付与する
- `focus-ring` は `src/index.css` で `@utility focus-ring { ... }` として定義され、展開後は以下と等価:

    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-gym-black
    focus-visible:ring-offset-2
    focus-visible:ring-offset-white

- shadcn `<Button>`（`src/components/ui/button.tsx`）は既にフォーカススタイルを内包しているため、追加指定は不要
- 非インタラクティブ要素（`<div onClick>` 等）は原則避ける。やむを得ず使う場合は `role="button"` と `tabIndex={0}` 付与のうえ `focus-ring` を適用する

**適用例**:

```tsx
<button
  type="button"
  onClick={onClick}
  aria-label="追加"
  className="focus-ring w-10 h-10 rounded-full bg-gym-black text-gym-white"
>
  <Plus size={16} weight="bold" />
</button>
```

**理由**:

- マウスクリック時のフォーカスリング表示は視覚ノイズになるため `focus-visible` を採用し、キーボード操作時のみ表示する
- `gym-black` リング + `ring-offset-white` は設計系のモノクロ基調と整合し、どのカード/ボタン色の上でも 4.5:1 のコントラストを確保

## ボタンコンポーネント選定

| ケース | 使うコンポーネント |
|:---|:---|
| ラベル付きボタン（テキスト ± アイコン）| `<Button>` |
| アイコンのみ（44px タップターゲット必須）| `<IconButton>` |
| `before:absolute` でタップ領域を外側に拡張 | 生の `<button>` + `focus-ring` |

### `<Button>`（`src/components/ui/button.tsx`）

ラベル付きボタン・フォーム送信・CTA に使用。

| variant | 用途 | 例 |
|:---|:---|:---|
| `default` | 主要 CTA（1 画面に 1 つ想定）| 「保存」「ログイン」 |
| `secondary` | 副次アクション | 「キャンセル」「下書き保存」 |
| `outline` | 中立のアクション・カード内ボタン | 「編集する」 |
| `ghost` | 低視覚重量のアクション | `EmptyDayState` の「追加」|
| `destructive` | 破壊的操作 | 「削除」「退会」|
| `link` | 文中リンク風 | 「詳細を見る」 |

| size | 用途 |
|:---|:---|
| `default` | 通常のフォーム内 |
| `sm` | コンパクト UI（カード内、リスト内）|
| `lg` | ヒーロー CTA（IdleView「トレーニングを始める」等）|

### `<IconButton>`（`src/components/ui/icon-button.tsx`）

アイコンのみのボタンに使用。`<Button>` に `min-h-[44px] min-w-[44px]` を付与したラッパー。

```tsx
// デフォルト: variant="ghost", size="icon"
<IconButton onClick={fn} aria-label="閉じる" className="rounded-full text-gym-zinc-500">
  <X size={16} weight="bold" />
</IconButton>

// 背景付き（className でオーバーライド）
<IconButton onClick={fn} aria-label="完了" className="rounded bg-gym-black text-gym-white hover:bg-gym-black/90">
  <Check size={14} weight="bold" />
</IconButton>
```

`aria-label` は必須。形状は `className="rounded-full"` / `rounded` / `rounded-md` で指定する。

### 生の `<button>` + `focus-ring`

`before:absolute` でタップ領域を要素外に拡張する場合のみ使用。

```tsx
<button
  type="button"
  aria-label="APIキーを表示"
  className="focus-ring relative text-gym-zinc-400 rounded-md before:absolute before:inset-[-10px]"
>
  <Eye size={18} />
</button>
```

**合意事項**（2026-05-03）:

- `<IconButton>` の登場により「アイコンのみ」の raw `<button>` 使用は `before:absolute` 拡張ケースのみに限定する
- メニュー項目（`w-full` レイアウト）は `<Button variant="ghost" className="w-full justify-start">` を使う
- `flex-1` レイアウトが必要なラベル付きボタンは `<Button className="flex-1">` で対応する
