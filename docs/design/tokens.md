# デザイントークン リファレンス

> AIセッション・コードレビュー向けの機械可読リファレンス。
> 実装の正は `src/index.css` の `@theme` ブロックと `src/components/`（特に `src/components/ui/`）のコード本体・テスト。
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
| `gym-paper` | `#FAF8F4` | Active Session 限定の暖色背景（[tactile-direction.md](tactile-direction.md) Matas 哲学 1）|

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

### クロムクリアランス（固定ヘッダー・BottomNav）

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

### 画面端ガター（横インセット）

画面端からの水平インセットは 1 種類（16px）に統一する。カード端とセクション見出し端が必ず揃う。

| クラス | 値 | 用途 |
|:---|:---|:---|
| `mx-page` / `px-page` | `16px` | カードの左右ガター（`mx-page`）、見出し等カード外テキストのインセット（`px-page`）|

**ルール**:
- 画面端の水平インセットに生の `px-4`/`px-5`/`px-6`・`mx-4` を直書きしない。`px-page`/`mx-page` を使う
- ヘッダーピル・BottomNav 等の固定クロム内部パディングはこの限りでない（独自の `px-2`/`px-3` を持つ）

### 縦リズム（軽量スケール）

縦方向の余白は以下の少数の意味的ステップに収束させる。`mb-5`/`mb-7`/`mb-10` 等の中間値は新規追加しない。

| 用途 | クラス | 値 |
|:---|:---|:---|
| 密なインライン（アイコン+ラベル、セット行内）| `gap-1` / `gap-2` | 4 / 8px |
| リスト要素間（種目間など）| `gap-3` | 12px |
| カード内ヘッダ → 本文 | `mb-3` | 12px |
| カード／セクション間（標準）| `mb-4` | 16px |
| 大きな区切り（カレンダーブロック等）| `mb-6` | 24px |

## カードコンポーネント

`rounded-[24px]` のコンテンツカードは [GymCard](../../src/components/GymCard.tsx) を使う。角丸・背景・影・内側 padding を内包しているため、呼び出し側で `rounded-[24px]`/`shadow-soft`/`p-4` 等を直書きしない。

| プロップ | 値 | 効果 |
|:---|:---|:---|
| `size` | `default`（既定）/ `sm` | 内側 padding `p-4`（16px）/ `p-3`（12px）|
| `variant` | `solid`（既定）/ `dashed` | 白背景+`shadow-soft` / 透明+破線（プレースホルダ）|

**ルール**:
- カード内 padding は GymCard が所有する。詰める／緩めるは GymCard 側で一括変更する
- 配置（`mx-page`・`mb-4` 等）と種別境界線（History の `border border-gym-zinc-100`）は配置責務として呼び出し側で付与する。Active Session のカードは境界線を持たない（[tactile-direction.md](tactile-direction.md) 紙化）
- 設定画面の `SectionCard`（`rounded-[20px]`・内部セクション構造）は別種のため GymCard 対象外


## ユーティリティ

| クラス | 用途 |
|:---|:---|
| `focus-ring` | 生の `<button>` など非 shadcn インタラクティブ要素のキーボードフォーカス表示 |
| `animate-appear` | カード・バブルの出現アニメーション（220ms スライドアップ）|
