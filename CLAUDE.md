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

**主要ライブラリ**: TanStack Query（サーバー状態）/ @base-ui/react（UI プリミティブ）/ shadcn（`src/components/ui/`）/ Phosphor Icons / react-day-picker / date-fns / Zod

**パスエイリアス**: `@/*` → `src/*`（`vite.config.ts`）

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
- **Playwright**: `playwright.config.ts` が `npm run dev` を自動起動。dev サーバー起動中に実行すると二重起動になるため注意。主環境は `Mobile Chrome (Pixel 5)`（モバイルファースト）、副に `chromium` デスクトップ
- **Vitest カバレッジ閾値**: lines/branches/functions/statements すべて 90%。除外対象は `vite.config.ts` の `coverage.exclude` を参照（`routeTree.gen.ts` / `main.tsx` / `routes/**` / `components/ui/**` / `types/**` / `useHydrated.ts` など）。テスト追加でカバレッジを上げようとする前に除外リストを確認する
- **Gemini モデル**: `gemini-flash-latest`（`src/lib/geminiClient.ts`）。API キーは localStorage に保存し、環境変数は使わない

## テストが仕様

テスト（Vitest/Playwright）が振る舞いの仕様です。テストが通れば仕様を満たしていると見なします。

- **ADR とコードが乖離した場合**: テストを正とする。ADR の更新は任意。
- **PRD とテストが矛盾した場合**: どちらかを自動的に正とせず、人間が判断する（`CONSTITUTION.md` D-003 参照）。

### 実装フローの順序（必須）

1. **PRD/ADR**（仕様変更を伴うなら先に更新）
2. **失敗するテスト**（Vitest/Playwright で red を確認）
3. **実装**（テストを green にする最小変更）
4. **リファクタ**（必要なら）

プランや作業順をファイル単位（"toolExecutor.ts を編集" → "useChatService.ts を編集" …）で組まない。フェーズ単位で組む。

**自己チェック** — `src/` 配下の非テストファイルを `Edit`/`Write` する直前に、対応するテストが先に書かれているかを確認する。書かれていなければフェーズ 2 に戻る。型不足でテストが書けない場合は最小の型スタブのみ先に入れ、impl は green 化フェーズに残す。

## 補助ルール

ディレクトリスコープのルールは `.claude/rules/` 配下に分離している（パスマッチ時のみ自動ロード）。

- [docs.md](.claude/rules/docs.md) — `docs/**/*.md` 編集時：ドキュメント構造、PRD/ADR の役割、リンク規約
- [design-system.md](.claude/rules/design-system.md) — `src/**/*.tsx` 編集時：デザイントークン規約、`src/components/ui/` 例外
