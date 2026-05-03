# デザイントークン リファレンス

> AIセッション・コードレビュー向けの機械可読リファレンス。
> ビジュアル確認は [design-system.html](../design-system.html) を参照。
> トークンの追加・変更は `src/index.css` の `@theme` ブロックのみを変更すること（T-004）。

## カラートークン

| Tailwind クラス | 値 | 用途 |
|:---|:---|:---|
| `gym-black` | `#09090b` | 主要テキスト、CTA ボタン背景 |
| `gym-white` | `#ffffff` | カード背景、ボタンテキスト |
| `gym-zinc-50` | `#fafafa` | ページ背景 |
| `gym-zinc-100` | `#f4f4f5` | サブ背景、入力フィールド背景 |
| `gym-zinc-200` | `#e4e4e7` | ボーダー（標準）|
| `gym-zinc-300` | `#d4d4d8` | ボーダー（強調）、仕切り線 |
| `gym-zinc-400` | `#a1a1aa` | アイコン、単位ラベル、プレースホルダー |
| `gym-zinc-500` | `#71717a` | サブテキスト、補助情報 |
| `gym-zinc-600` | `#52525b` | セカンダリテキスト |
| `gym-zinc-900` | `#18181b` | 見出し（最暗）|
| `gym-accent` | `#DE3A2B` | アクセント（赤）、通知バッジ |

Opacity 修飾子は許容: `bg-gym-white/80`、`border-gym-zinc-200/60` など。

## 禁止クラス → 置換マッピング

| 禁止 | 正しい |
|:---|:---|
| `text-black`, `bg-black` | `text-gym-black`, `bg-gym-black` |
| `text-white`, `bg-white`, `border-white` | `text-gym-white`, `bg-gym-white`, `border-gym-white` |
| `bg-zinc-*`, `text-zinc-*`, `border-zinc-*` | `bg-gym-zinc-*`, `text-gym-zinc-*`, `border-gym-zinc-*` |
| `bg-accent`, `text-accent` | `bg-gym-accent`, `text-gym-accent` |

**例外**: `src/components/ui/` 配下の shadcn/ui コンポーネントは okLCH 変数を使うため対象外。

## シャドウトークン

| クラス | 値 | 用途 |
|:---|:---|:---|
| `shadow-soft` | `0 2px 8px rgba(0,0,0,0.04)` | カード、チャットバブル、インプット枠 |
| `shadow-float` | `0 8px 24px rgba(0,0,0,0.10)` | フローティング UI（AppHeader ピル、ドロップダウン）|

`shadow-sm`/`shadow-md`/`shadow-lg` はカード/フローティング用途では使用しない。

## ボーダーラジウス スケール

| 用途 | クラス |
|:---|:---|
| 行アイテム（密なレイアウト）| `rounded-xl` |
| カード・モーダル | `rounded-[24px]` |
| ピル・ヘッダー | `rounded-full` |

## フォントトークン

| クラス | フォント | 用途 |
|:---|:---|:---|
| `font-outfit` | Outfit | 見出し、数値（種目名・セット数値・ページタイトル）|
| （デフォルト）| Sora | 本文・UI テキスト |
| `font-jp` | Noto Sans JP | 日本語単位ラベル（`kg`, `回` 等）|

## スペーシングトークン

固定ヘッダー・BottomNav の高さから導かれる意味的スペーシング。直接 `pt-16`/`pb-24` 等を書かない。

| クラス | 値 | 用途 |
|:---|:---|:---|
| `pt-content-top` | `64px` | 固定ヘッダーのクリアランス（`_app.tsx` と `SettingsPage` が使用）|
| `pb-content-bottom` | `96px` | BottomNav クリアランス（`_app.tsx` が使用、非スクロールページ向け）|
| `pb-content-bottom-scroll` | `128px` | スクロールコンテナの下余白（`HistoryPage`・`ActiveSessionView` 等）|
| `pb-content-bottom-chat` | `160px` | チャット入力 + BottomNav クリアランス（`AIChatPage` が使用）|

**ルール**:
- `_app.tsx` の `<main>` が `pt-content-top pb-content-bottom` を持ち、配下ページは `pt-`/`pb-` を書かない
- `overflow-y-auto` スクロールコンテナは `pb-content-bottom-scroll` を使って自身の下余白を管理する
- `SettingsPage`（`_app` 外）は `pt-content-top` を自身で持つ
- `AIChatPage` は固定 ChatInput をクリアするため `pb-content-bottom-chat` を使う

## ユーティリティ

| クラス | 用途 |
|:---|:---|
| `focus-ring` | 生の `<button>` など非 shadcn インタラクティブ要素のキーボードフォーカス表示 |
| `animate-appear` | カード・バブルの出現アニメーション（220ms スライドアップ）|
