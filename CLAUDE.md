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
├── design-system.html    # UIデザイン参照（ビジュアル）
├── design/               # デザインシステム（機械可読）
│   ├── tokens.md         # カラー・シャドウ・フォント・ボーダーラジウス
│   ├── components.md     # コンポーネント規約の索引
│   ├── focus.md          # フォーカスリング規約（focus-ring ユーティリティ）
│   ├── button.md         # Button / IconButton / 生の button 使い分け
│   └── input.md          # Input（prefix/suffix）/ select wrapper
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

### デザインシステム

UIコンポーネントは `docs/design/` のルールに従って実装する。

| リファレンス | 内容 |
|:---|:---|
| [tokens.md](docs/design/tokens.md) | カラー・シャドウ・ボーダーラジウス・フォントトークン、禁止クラス一覧 |
| [components.md](docs/design/components.md) | 索引（focus / button / input へのリンク）|
| [focus.md](docs/design/focus.md) | フォーカスリング規約（focus-ring ユーティリティ）|
| [button.md](docs/design/button.md) | Button / IconButton / 生の button 使い分け |
| [input.md](docs/design/input.md) | Input（prefix/suffix）/ select wrapper |

**トリガー条件**: UIコンポーネント（`.tsx`）の新規作成・修正時は必ず `tokens.md` を参照し、`gym-*` トークンを使用する。`src/components/ui/` (shadcn) は対象外。
