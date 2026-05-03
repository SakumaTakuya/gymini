# インプットコンポーネント規約

> フォーカスリングの共通規約は [focus.md](focus.md) を参照。

## `<Input>`（`src/components/ui/input.tsx`）

テキスト入力（`<input>`）は原則 `<Input>` を使用する。手書きの `<input className="...">` や `<div>` でラップするコンポジット構造を消費コード側に書かない。

### variant

| variant | 外観 | 用途 |
|:---|:---|:---|
| `"inline"`（**デフォルト**）| border-b のみ、背景透明 | フォーム入力・インライン編集 |
| `"filled"` | `bg-gym-zinc-100` ボックス | 検索フィールド（目立たせたい場合）|

### props

| props | 用途 |
|:---|:---|
| `variant` | `"inline"` \| `"filled"`（省略時 `"inline"`）|
| `prefix` | input 左側の要素（アイコン等）|
| `suffix` | input 右側の要素（単位ラベル・アクションボタン等）|
| `containerClassName` | prefix/suffix がある場合の外側コンテナのクラス上書き|
| `className` | 内部 `<input>` のクラス上書き（フォント・幅等）|

### 描画モード

- **prefix/suffix なし** → `<input>` 要素を直接描画
- **prefix or suffix あり** → スタイル済み `<div>` コンテナの中に透明な `<input>` を描画

### フォーカス表示

- `variant="inline"` 単体: `focus-visible:border-gym-black`（border-b が黒に変化）
- `variant="inline"` + prefix/suffix: `focus-within:border-gym-black`
- `variant="filled"` 単体: `focus-ring`（リング表示）
- `variant="filled"` + prefix/suffix: `focus-within:ring-2 focus-within:ring-gym-black`

### 標準スペック（inline）

- 高さ: `h-11`、border-b: `border-gym-zinc-300`、背景: 透明
- フォント: `text-base font-medium`、文字色: `text-gym-black`、プレースホルダー: `placeholder:text-gym-zinc-400`

### 使用例

```tsx
// フォーム入力（inline デフォルト）
<Input
  type="text"
  value={editName}
  onChange={handleEditNameChange}
  aria-label="種目名を編集"
  autoFocus
/>

// 単位ラベル付き（inline デフォルト）
<Input
  type="number"
  value={localWeightKg}
  onChange={handleWeightChange}
  placeholder="70"
  suffix={<span className="text-xs text-gym-zinc-400">kg</span>}
/>

// パスワード + 表示切替ボタン（inline デフォルト）
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

// インライン編集（containerClassName で高さ・揃えを上書き）
<Input
  type="number"
  value={pendingSet.weight}
  inputMode="decimal"
  suffix={<span className="text-xs font-medium text-gym-zinc-400">kg</span>}
  containerClassName="items-baseline gap-1 h-auto pb-0.5"
  className="w-10 text-xl font-outfit font-bold"
/>

// 検索フィールド（filled + containerClassName で寸法を上書き）
<Input
  type="text"
  value={query}
  onChange={...}
  placeholder="種目を追加..."
  prefix={<Plus size={18} weight="bold" className="text-gym-zinc-500 flex-shrink-0" />}
  variant="filled"
  containerClassName="w-full h-[52px] rounded-2xl border-transparent gap-3"
/>
```

## `<Input>` を使わない例外

| 要素 | 理由 |
|:---|:---|
| `ChatInput.tsx`（textarea）| `<textarea>` であり、チャットバブル内の特殊レイアウト。`focus-ring` 済み |

## select wrapper

`<Input>` は `<input>` 専用。select は `<Input>` の inline コンテナと同じスタイルを手動で適用する。

```tsx
<div className="flex items-center border-b border-gym-zinc-300 h-11 focus-within:border-gym-black">
  <select className="w-full bg-transparent text-base font-medium outline-none appearance-none cursor-pointer text-gym-black">
    ...
  </select>
</div>
```

select 自身に `focus-ring` を付けると二重表示になるため、wrapper の `focus-within:border-gym-black` のみ適用する。
