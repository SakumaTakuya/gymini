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

## インプットコンポーネント

### `<Input>`（`src/components/ui/input.tsx`）

テキスト入力（`<input>`）は原則 `<Input>` を使用する。手書きの `<input className="bg-gym-zinc-100 ...">` や `<div>` でラップするコンポジット構造を消費コード側に書かない。

| props | 用途 |
|:---|:---|
| `prefix` | input 左側の要素（アイコン等）|
| `suffix` | input 右側の要素（単位ラベル・アクションボタン等）|
| `containerClassName` | prefix/suffix がある場合の外側コンテナのクラス上書き（高さ・角丸・border 等）|
| `className` | 内部 `<input>` のクラス上書き（フォント等）|

**2 つの描画モード**:

- **prefix/suffix なし** → `<input>` 単体を描画。`focus-ring` でフォーカスリングを表示
- **prefix or suffix あり** → スタイル済み `<div>` コンテナの中に透明な `<input>` を描画。`focus-within:ring-*` でフォーカスリングを表示

**標準スペック**:

- 高さ: `h-11`、角丸: `rounded-xl`、背景: `bg-gym-zinc-100`、ボーダー: `border-gym-zinc-200`（コンテナのみ）
- フォント: `text-base font-medium`、文字色: `text-gym-black`、プレースホルダー: `placeholder:text-gym-zinc-400`

**使用例**:

```tsx
// 単体（ラベル付きフォーム入力）
<Input
  type="text"
  value={editName}
  onChange={handleEditNameChange}
  aria-label="種目名を編集"
  autoFocus
/>

// 単位ラベル付き
<Input
  type="number"
  value={localWeightKg}
  onChange={handleWeightChange}
  placeholder="70"
  suffix={<span className="text-xs text-gym-zinc-400">kg</span>}
/>

// アイコン + アクションボタン
<Input
  type={visible ? 'text' : 'password'}
  value={localValue}
  onChange={handleChange}
  placeholder="APIキーを入力"
  className="font-mono tracking-wider"
  suffix={
    <button type="button" onClick={...} aria-label="APIキーを表示" className="focus-ring ...">
      <Eye size={16} />
    </button>
  }
/>

// 大型サーチフィールド（containerClassName で寸法を上書き）
<Input
  type="text"
  value={query}
  onChange={...}
  placeholder="種目を追加..."
  prefix={<Plus size={18} weight="bold" className="text-gym-zinc-500 flex-shrink-0" />}
  containerClassName="w-full h-[52px] rounded-2xl border-transparent gap-3"
/>
```

### `<Input>` を使わない例外

| 要素 | 理由 |
|:---|:---|
| `ChatInput.tsx`（textarea）| `<textarea>` であり、チャットバブル内の特殊レイアウト。`focus-ring` 済み |
| `PendingSetRow.tsx`（インライン数値）| `text-xl font-outfit font-bold` + `border-b` の意図的なインライン編集デザイン |
| `<select>` 全般 | `<Input>` は `<input>` 専用。select は wrapper div に `focus-within:ring-*` を適用 |

### select wrapper のフォーカスリング

```tsx
<div className="flex items-center bg-gym-zinc-100 rounded-xl px-4 h-11 border border-gym-zinc-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-gym-black focus-within:ring-offset-2 focus-within:ring-offset-white">
  <select className="w-full bg-transparent text-base font-medium outline-none appearance-none cursor-pointer">
    ...
  </select>
</div>
```

select 自身に `focus-ring` を付けると wrapper の `focus-within:ring` と二重表示になるため、片方のみ適用する。
