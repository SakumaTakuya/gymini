## コマンド

| コマンド | 用途 |
|---|---|
| `npm run dev` | 開発サーバー起動（Vite, http://localhost:5173/gymini/）|
| `npm run build` | 本番ビルド |
| `npm run test` | Vitest 単体テスト（1回実行）|
| `npm run test:watch` | Vitest ウォッチモード |
| `npm run test:coverage` | カバレッジ計測（閾値 90%）|
| `npm run typecheck` | 型チェックのみ（ビルドなし）|
| `npm run lint` | ESLint |
| `npx playwright test` | E2E テスト（dev サーバーは自動起動）|

## アーキテクチャ概要

**テックスタック**: React 19 / TanStack Router (file-based) / Zustand / Vitest+jsdom / Playwright / Tailwind v4 / Google Gemini Flash

```
src/
├── routes/          # TanStack Router ファイルルーティング（__root, _app/*）
├── pages/           # ルートに対応するページコンポーネント
├── components/      # 共通 UI（chat/, settings/, workout/, ui/ = shadcn）
├── stores/          # Zustand ストア + localStorage 永続化
├── hooks/           # カスタムフック（useHydrated, useWorkoutSession など）
├── lib/             # ユーティリティ・リポジトリ・Gemini クライアント
├── schemas/         # Zod スキーマ（workout, date）
├── types/           # 共通型定義
└── test/            # Vitest グローバルセットアップ + integration テスト
```

**ルーティング構造**: `/__root → /_app → /training | /ai | /history`, `/settings` は `/_app` 外

## Gotchas

- **ベースパス**: Vite/Playwright ともに `/gymini/` がベース。ナビゲーションに `/gymini/` を直書きしない（TanStack Router が解決する）
- **localStorage ハイドレーション**: `useHydrated()` が `false` の間は `AppLayout` がブランク表示。ストアデータを参照するコンポーネントは必ずこのフックを通す
- **localStorage キー**: `gymini:workouts` / `gymini:exercises` / `gymini:settings` / `gymini:user-profile`
- **Playwright**: `playwright.config.ts` が `npm run dev` を自動起動。dev サーバー起動中に実行すると二重起動になるため注意
- **Vitest カバレッジ閾値**: lines/branches/functions/statements すべて 90%。`src/routeTree.gen.ts`（自動生成）はカバレッジ対象外
- **Gemini モデル**: `gemini-flash-latest`（`src/lib/geminiClient.ts`）。API キーは localStorage に保存し、環境変数は使わない

## ドキュメント構造

このプロジェクトのドキュメントは `docs/` 配下に置きます。

```
docs/
├── CONSTITUTION.md       # プロジェクト原則（最上位）
├── design-system.html    # UIデザイン参照
├── prd/                  # PRD（プロダクト要求仕様書）
│   ├── index.md          # プロダクト全体の PRD
│   ├── {feature}/index.md
│   └── {feature}.md
└── adr/                  # アーキテクチャ判断記録（ADR）
    └── {feature}.md
```

**トリガー条件**:

- `docs/` 配下のファイルの読み取りまたは変更
- 新しい PRD または ADR の作成
- `docs/` ドキュメントを参照する機能の実装

### PRD の役割

`docs/prd/` は「プロダクトとして何を・なぜ作るか」の唯一の真実です。機能追加・変更時に更新必須。

### ADR の役割

`docs/adr/` は「なぜこの技術・パターンを選んだか」のアーキテクチャ判断記録です。コードから読み取れない判断・トレードオフのみ記録します。コンポーネント構造・実装詳細は書きません。新規機能でアーキテクチャ上の判断が生じた場合のみ作成（任意）。

### テストが仕様

テスト（Vitest/Playwright）が振る舞いの仕様です。テストが通れば仕様を満たしていると見なします。

- **ADR とコードが乖離した場合**: テストを正とする。ADR の更新は任意。
- **PRD とテストが矛盾した場合**: どちらかを自動的に正とせず、人間が判断する（`CONSTITUTION.md` D-003 参照）。

### ドキュメントリンク規約

ドキュメント内のマークダウンリンクは以下の形式に従ってください:

| リンク先       | 形式                                    | リンクテキスト   | 例                                                    |
|:-----------|:--------------------------------------|:----------|:-----------------------------------------------------|
| **ファイル**   | `[filename.md](パスまたはURL)`             | ファイル名を含める | `[workout.md](../prd/workout/index.md)` |
| **ディレクトリ** | `[directory-name](パスまたはURL/index.md)` | ディレクトリ名のみ | `[workout](../prd/workout/index.md)`               |

### キーボードフォーカス規約（focus-visible）

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
  className="focus-ring w-10 h-10 rounded-full bg-gym-black text-white"
>
  <Plus size={16} weight="bold" />
</button>
```

**理由**:

- マウスクリック時のフォーカスリング表示は視覚ノイズになるため `focus-visible` を採用し、キーボード操作時のみ表示する
- `gym-black` リング + `ring-offset-white` は設計系のモノクロ基調と整合し、どのカード/ボタン色の上でも 4.5:1 のコントラストを確保

### shadcn `<Button>` 採用方針

`src/components/ui/button.tsx` は shadcn/ui ベースの共通コンポーネント。新規実装時は以下の基準で選定する。

#### 採用優先順位

1. **shadcn `<Button>` を第一選択とする** — ラベル付きボタン（テキスト + アイコン可）、フォーム送信・ダイアログアクション・ページ主要 CTA 等は原則 `<Button>` を使う
2. **raw `<button>` は以下のケースに限定**:
   - アイコンのみの操作（削除・編集・閉じる・候補選択など）で、設計系に合わせた独自 padding/bg/border-radius が必要
   - リスト要素内の行操作（Tap target のみ 44px 確保しつつ余白は最小に）
   - 既存の `min-h-[44px] min-w-[44px] before:absolute` 等で tap 領域を外側に拡張している場合

#### variant / size の使い分け

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
