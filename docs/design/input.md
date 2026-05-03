# インプットコンポーネント規約

> フォーカスリングの共通規約は [focus.md](focus.md) を参照。

## `<Input>`（`src/components/ui/input.tsx`）

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

## `<Input>` を使わない例外

| 要素 | 理由 |
|:---|:---|
| `ChatInput.tsx`（textarea）| `<textarea>` であり、チャットバブル内の特殊レイアウト。`focus-ring` 済み |
| `PendingSetRow.tsx`（インライン数値）| `text-xl font-outfit font-bold` + `border-b` の意図的なインライン編集デザイン |
| `<select>` 全般 | `<Input>` は `<input>` 専用。select は wrapper div に `focus-within:ring-*` を適用 |

## select wrapper のフォーカスリング

```tsx
<div className="flex items-center bg-gym-zinc-100 rounded-xl px-4 h-11 border border-gym-zinc-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-gym-black focus-within:ring-offset-2 focus-within:ring-offset-white">
  <select className="w-full bg-transparent text-base font-medium outline-none appearance-none cursor-pointer">
    ...
  </select>
</div>
```

select 自身に `focus-ring` を付けると wrapper の `focus-within:ring` と二重表示になるため、片方のみ適用する。
