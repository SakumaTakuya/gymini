# ADR: navigation

## TanStack Router + createHashHistory + basepath

- **決定**: `createHashHistory()` + `basepath: '/gymini'` の組み合わせを使用
- **理由**: GitHub Pages は SPA のサーバーサイドリダイレクトをサポートしない。ハッシュ履歴を使えば、サーバー設定なしで SPA が動作する。A-001（Library-First）にも準拠。

## Pathless レイアウトルート（`_app.tsx`）で UI クロームを制御

- **決定**: `_app.tsx` を pathless レイアウトルートとして使用し、BottomNav や GearIcon の表示をページ単位ではなくルート構造で制御する
- **理由**: 条件分岐（`route !== 'settings' && ...`）で書くより、構造的にクロームを管理できる。FRAME5（/settings）はこのレイアウト外に置くことで除外が明示的になる。

## GearIcon の配置はページ側が担う

- **決定**: 各ページが自身のレイアウトで GearIcon の位置（className）を指定する
- **理由**: FRAME ごとにヘッダークロームのレイアウトが異なる（FRAME2 の SessionHeader は GearIcon を内包する）。グローバルレイアウトに置くと FRAME 固有の位置制御が難しくなる。

## /settings からの戻りにブラウザ履歴を使用

- **決定**: `/settings` からの戻りに `useCanGoBack()` + `router.history.back()` を使用する
- **理由**: ネイティブなナビゲーション体験を提供できる。`previousRoute` を Zustand で管理する複雑さを排除できる。

## BottomNav から AI 専用タブを撤去（タイムライン統合に伴う）

- **決定**: BottomNav は Training + History の 2 タブ構成とし、AI 専用ボタン（旧 IR_001）を撤去する。AI 対話はワークアウトセッション（FRAME2）のタイムライン UX 内でのみ提供される
- **理由**:
  - AI 対話の文脈は「アクティブなセッション」と不可分。独立したタブで「セッション無し AI 対話」を許すと、書き込み tool の到達経路が増えて B-002 の保証が複雑化する
  - タブを減らすことで親指操作の選択肢が単純化され、Mobile-First UI（T-003）に沿う
- **トレードオフ**:
  - 「セッション開始しないと AI と話せない」UX 制約。ただしビジョン上は意図された制約。API キー設定や種目マスター閲覧など、対話を必要としない情報はそれぞれ FRAME5 / 既存ページで提供する
  - 旧 `/ai` ルートは Phase 9 で完全撤去済み。`/ai` への直接アクセスは `notFoundComponent` 経由で `/training` にフォールバックする
