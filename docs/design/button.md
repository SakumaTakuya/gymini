# ボタンコンポーネント規約

> フォーカスリングの共通規約は [focus.md](focus.md) を参照。

| ケース | 使うコンポーネント |
|:---|:---|
| ラベル付きボタン（テキスト ± アイコン）| `<Button>` |
| アイコンのみ（44px タップターゲット必須）| `<IconButton>` |
| `before:absolute` でタップ領域を外側に拡張 | 生の `<button>` + `focus-ring` |

## `<Button>`（`src/components/ui/button.tsx`）

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

## `<IconButton>`（`src/components/ui/icon-button.tsx`）

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

## 生の `<button>` + `focus-ring`

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
