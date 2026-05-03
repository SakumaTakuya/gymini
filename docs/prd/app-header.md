---
id: "prd-app-header"
title: "アプリヘッダー（AppHeader）"
type: "prd"
status: "draft"
created: "2026-04-29"
updated: "2026-04-30"
depends-on: ["prd-gymini", "prd-navigation"]
tags: ["navigation", "ui", "app-shell", "header"]
category: "ui"
priority: "medium"
risk: "low"
---

# アプリヘッダー（AppHeader）要求仕様書

**親要求:** [index.md](index.md) - REQ_007 (UI Design)、IR_002（歯車アイコン）

**関連要求:** [navigation.md](navigation.md) - IR_001（BottomNav）、IR_002（GearIcon）

**デザインリファレンス:** [design-system.html](../design-system.html) 全FRAME共通

## 概要

gymini の各画面（FRAME1〜5）に共通のヘッダー領域を「規定」し、画面ごとのタイトル・補助情報・操作ボタンを統一されたレイアウトで提供する。BottomNav が IR_001 として規定されている水準と同等の構造化を、画面上部にも適用する。

これまで各画面が独自に `pt-16` パディングと `absolute top-12 right-4` で浮かせた歯車アイコンや操作ボタンを再実装していたため、視覚仕様（高さ・余白・タイポグラフィ）が画面間で不揃いだった。AppHeader はこれを単一の規定として吸収する。

---

## 1. 動機（Why）

### 1.1. 現状の課題

| 観点 | 現状 | 課題 |
|------|------|------|
| 視覚的整合性 | 各ページが独自に `pt-16` + 浮かせた歯車を配置 | 高さ・余白がページごとに微妙に異なる |
| 構造の重複 | `IdleView`, `HistoryPage`, `AIChatPage`, `SessionHeader`, `SettingsPage` がそれぞれ chrome を再実装 | 変更時の影響範囲が広く、保守性が低い |
| アクセシビリティ | タイトル（`<h1>`）が一部ページにしかない（`AIChatPage` のみ） | スクリーンリーダー利用時の現在地特定が困難 |
| AIChatPage の重複 | 独自 `<header sticky>` と浮かせた `<GearIcon>` の二重配置 | 視覚ノイズ |

### 1.2. 期待する成果

- 全画面で一貫した上部 chrome（高さ・タイトル位置・余白）
- 歯車アイコンの単一配置（trailing slot 経由）
- アクセシビリティの向上（`role="banner"` + `<h1>` タイトルの常時表示）
- 新規画面追加時のコスト削減（タイトルと slot を渡すだけで済む）

---

## 2. 要求図（SysML Requirements Diagram）

```mermaid
requirementDiagram
    requirement AppHeader {
        id: REQ_010
        text: "アプリヘッダー（全画面共通の上部chrome）"
        risk: low
        verifymethod: inspection
    }

    interfaceRequirement HeaderMount {
        id: IR_003
        text: "AppHeader は AppLayout（_app.tsx）に1度だけマウントされる（BottomNav と同等）"
        risk: low
        verifymethod: inspection
    }

    interfaceRequirement HeaderTitle {
        id: IR_004
        text: "タイトル（<h1>）はセッション中（FRAME2）と設定（FRAME5）のみ必須表示。トップレベルページ（FRAME1, 3, 4）はアクションピルのみを表示し、タイトルは省略する"
        risk: low
        verifymethod: inspection
    }

    interfaceRequirement HeaderSlots {
        id: IR_005
        text: "leading（左アイコン）/ trailing（右操作ボタン群）スロットで各画面が内容を提供する"
        risk: low
        verifymethod: inspection
    }

    interfaceRequirement HeaderVariant {
        id: IR_006
        text: "default / session-active / modal の3 variant で高さと装飾を調整する"
        risk: low
        verifymethod: inspection
    }

    interfaceRequirement HeaderSettingsScope {
        id: IR_007
        text: "設定画面（FRAME5、layout 外）は AppHeader を直接呼び出して X 閉じるボタンを trailing に配置する"
        risk: low
        verifymethod: inspection
    }

    designConstraint VisualSpec {
        id: DC_006
        text: "フローティングピル形状（rounded-full, h-11, fixed top-3）、frosted background（bg-white/80 backdrop-blur-xl）、border 統一。全幅バーは廃止"
        risk: low
        verifymethod: inspection
    }

    AppHeader - contains -> HeaderMount
    AppHeader - contains -> HeaderTitle
    AppHeader - contains -> HeaderSlots
    AppHeader - contains -> HeaderVariant
    AppHeader - contains -> HeaderSettingsScope
    AppHeader - contains -> VisualSpec

    HeaderMount - traces -> IR_001
    HeaderSlots - traces -> IR_002
```

---

## 3. インターフェース要求

### IR_003: 単一マウント

AppHeader は `AppLayout`（`_app.tsx`）に1度だけマウントされる。BottomNav と対称な構造で、画面遷移時にも DOM が再生成されず、スクロール状態を維持する。

**検証方法:** インスペクションによる検証

### IR_004: タイトル表示（条件付き）

BottomNav がタブ選択状態を視覚的に示すため、トップレベルページ（FRAME1 idle, 3, 4）ではヘッダーにタイトルを表示せず、アクションボタン専用のピルとする。タイトルは文脈が BottomNav で判断できないページのみ表示する。

**画面別タイトル:**

| FRAME | 画面 | タイトル |
|:------|:-----|:---------|
| FRAME1 | Training Idle | 表示しない（BottomNav で判別可能） |
| FRAME2 | Active Workout | `セッション中` |
| FRAME3 | History | 表示しない（BottomNav で判別可能） |
| FRAME4 | AI Chat | 表示しない（BottomNav で判別可能） |
| FRAME5 | Settings | `設定` |

**検証方法:** インスペクションによる検証

### IR_005: leading / trailing スロット

各画面は `title` 以外に `leading`（左の補助アイコン）と `trailing`（右の操作ボタン群）を任意で提供できる。歯車アイコン（IR_002）は trailing slot 経由で表示する。

**画面別 slot 構成:**

| FRAME | leading | trailing |
|:------|:--------|:---------|
| FRAME1 | — | `<GearIcon/>` |
| FRAME2 | — | TimerPill + 終了ボタン + GearIcon |
| FRAME3 | — | `<GearIcon/>` |
| FRAME4 | — | `<GearIcon/>` |
| FRAME5 | — | X 閉じるボタン |

**検証方法:** インスペクションによる検証

### IR_006: variant（default / session-active / modal）

ヘッダー高さと装飾の差分を3 variant で表現する。

| variant | 高さ | 用途 |
|:--------|:-----|:-----|
| default | h-14（56px） | 通常の画面（FRAME1, 3, 4） |
| session-active | min-h-14 + py-2 | アクティブセッション（FRAME2）。trailing が複数行になる場合に対応 |
| modal | h-14 | 設定画面（FRAME5）。`role="banner"` + `data-variant="modal"` でセマンティクスを明示 |

**検証方法:** インスペクションによる検証

### IR_007: 設定画面のスコープ

FRAME5（`/settings`）は `_app` レイアウト外に配置されているため、AppLayout の AppHeader は表示されない。設定画面は `<AppHeader>` を直接呼び出し、`variant="modal"` で X 閉じるボタンを trailing に配置する。

**検証方法:** インスペクションによる検証

---

## 4. 設計制約

### DC_006: 視覚スペック

- 形状: `rounded-full`（ピル）、`fixed` ポジショニング。全幅バー（`sticky h-14`）は廃止
- 高さ: `h-11`（44px）。session-active のみ `min-h-[44px] py-1.5` で可変
- 位置: デフォルト variant は `top-3`（`pt-3`）、左右は `px-4` マージン
- 背景: `bg-white/80 backdrop-blur-xl`（frosted）
- 境界: `border border-zinc-200/60`（`border-b` ではなく全周）
- shadow: `shadow-sm`
- z-index: 30（BottomNav より下、モーダルより上）
- `pointer-events-none` でオーバーレイ、ピル要素自体は `pointer-events-auto`
- コンテンツ領域: ページ側は `pt-16` を確保してピルの下に隠れないようにする
- タイトル: `font-outfit font-bold text-base text-zinc-900 truncate`（表示する場合）
- タップ領域: trailing 内の操作要素は最低 44×44px を確保（T-003）
- フォーカス: trailing の raw `<button>` には `focus-ring` を適用（CLAUDE.md 規約）

**検証方法:** インスペクションによる検証

---

## 5. スコープ外

- 画面間トランジションアニメーション（フェードなど）
- ヘッダー内の戻るボタンナビゲーション（現状はブラウザ履歴で対応）
- 通知バッジ・検索バーのヘッダー埋め込み
- ダークモード（モノクロ基調のため当面不要）
- ヘッダー内のサブタイトル・パンくず
- スクロール時のヘッダー縮小・隠れる挙動

---

## 6. PRD整合性確認

| 親要求ID | 要求 | 本PRDでの対応 |
|----------|------|--------------|
| REQ_007 | スマホファーストのUI設計 | DC_006（視覚スペック）|
| IR_001 | BottomNav | IR_003（同等の構造化を上部にも適用）|
| IR_002 | 歯車アイコン | IR_005（trailing slot 経由で表示）|
