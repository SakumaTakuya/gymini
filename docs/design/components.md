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

## shadcn `<Button>` 採用方針

`src/components/ui/button.tsx` は shadcn/ui ベースの共通コンポーネント。新規実装時は以下の基準で選定する。

### 採用優先順位

1. **shadcn `<Button>` を第一選択とする** — ラベル付きボタン（テキスト + アイコン可）、フォーム送信・ダイアログアクション・ページ主要 CTA 等は原則 `<Button>` を使う
2. **raw `<button>` は以下のケースに限定**:
   - アイコンのみの操作（削除・編集・閉じる・候補選択など）で、設計系に合わせた独自 padding/bg/border-radius が必要
   - リスト要素内の行操作（Tap target のみ 44px 確保しつつ余白は最小に）
   - 既存の `min-h-[44px] min-w-[44px] before:absolute` 等で tap 領域を外側に拡張している場合

### variant / size の使い分け

| variant | 用途 | 例 |
|:---|:---|:---|
| `default` | 主要 CTA（1 画面に 1 つ想定）| 「保存」「ログイン」 |
| `secondary` | 副次アクション | 「キャンセル」「下書き保存」 |
| `outline` | 中立のアクション・カード内ボタン | 「編集する」 |
| `ghost` | 低視覚重量のアクション（カード内リンク相当）| `EmptyDayState` の「追加」|
| `destructive` | 破壊的操作 | 「削除」「退会」|
| `link` | 文中リンク風 | 「詳細を見る」 |

| size | 用途 |
|:---|:---|
| `default` | 通常のフォーム内 |
| `sm` | コンパクト UI（カード内、リスト内）|
| `lg` | ヒーロー CTA（IdleView「トレーニングを始める」等）|
| `icon` / `icon-sm` / `icon-lg` | アイコンのみ — ただし raw `<button>` で独自スタイル必要な場合はそちらを採用可 |

**合意事項**（2026-04-13）:

- 新規追加の**ラベル付きボタン**は `<Button>` を第一選択
- 既存の raw `<button>` は `focus-ring` を付与して a11y を整えた上で据え置き
- アイコンのみ・密レイアウトは raw `<button>` も可（理由を PR 内で説明）
