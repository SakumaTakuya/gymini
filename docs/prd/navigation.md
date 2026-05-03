---
id: "prd-navigation"
title: "ページナビゲーション"
type: "prd"
status: "draft"
created: "2026-03-28"
updated: "2026-05-03"
depends-on: ["prd-gymini", "prd-workout", "prd-history", "prd-ai-chat", "prd-settings"]
tags: ["navigation", "routing", "bottom-nav"]
category: "ui"
priority: "high"
risk: "medium"
---

# ページナビゲーション 要求仕様書

**親要求:** [index.md](index.md) - REQ_007 (UI Design), IR_001 (ナビゲーション)

**関連要求:** [app-header.md](app-header.md) - 全画面共通の上部 chrome（タイトル・leading/trailing slot）

**デザインリファレンス:** [design-system.html](../design-system.html) 全FRAME共通

## 概要

gymini のページナビゲーションアーキテクチャを定義する。

- **BottomNav**: 2タブ（Training + History）+ 右側 AI 専用ボタン
- **歯車アイコン**: 全画面の右上に固定、タップで設定画面へ遷移
- **ルーティング**: 5つの論理画面（FRAME1〜5）をクライアントサイドで管理

---

## 1. 画面遷移図

```mermaid
graph TB
    subgraph "gymini ナビゲーション"
        User((ユーザー))
        FRAME1["FRAME1: Training Idle"]
        FRAME2["FRAME2: Active Workout"]
        FRAME3["FRAME3: History"]
        FRAME4["FRAME4: AI Chat"]
        FRAME5["FRAME5: Settings"]
    end

    User -->|"トレーニングを始める"| FRAME1
    FRAME1 -->|"セッション開始"| FRAME2
    FRAME2 -->|"終了ボタン"| FRAME1

    FRAME1 <-->|"BottomNav: 履歴タブ"| FRAME3
    FRAME1 <-->|"BottomNav: AIボタン"| FRAME4
    FRAME3 <-->|"BottomNav: AIボタン"| FRAME4

    FRAME1 -->|"歯車アイコン"| FRAME5
    FRAME2 -->|"歯車アイコン"| FRAME5
    FRAME3 -->|"歯車アイコン"| FRAME5
    FRAME4 -->|"歯車アイコン"| FRAME5
    FRAME5 -->|"Xボタン"| FRAME5_PREV["遷移元に戻る"]
```

---

## 2. 要求図（SysML Requirements Diagram）

```mermaid
requirementDiagram
    requirement PageNavigation {
        id: REQ_007
        text: "ページナビゲーションアーキテクチャ"
        risk: medium
        verifymethod: demonstration
    }

    functionalRequirement TrainingPage {
        id: FR_017
        text: "トレーニングページ: Idle（FRAME1）とActive（FRAME2）の2状態"
        risk: high
        verifymethod: test
    }

    functionalRequirement HistoryPage {
        id: FR_018
        text: "履歴ページ（FRAME3）: カレンダー＋記録サマリー"
        risk: medium
        verifymethod: test
    }

    functionalRequirement SessionPersistence {
        id: FR_019
        text: "セッション状態をタブ遷移・リロード間で永続化"
        risk: high
        verifymethod: test
    }

    functionalRequirement AIChatPage {
        id: FR_020
        text: "AIチャットページ（FRAME4）: 常時アクセス可能"
        risk: high
        verifymethod: test
    }

    interfaceRequirement BottomNav {
        id: IR_001
        text: "2タブ + AI専用ボタンのBottomNav"
        risk: medium
        verifymethod: inspection
    }

    interfaceRequirement GearIcon {
        id: IR_002
        text: "全画面の右上に固定の歯車アイコン → 設定画面へ遷移"
        risk: low
        verifymethod: inspection
    }

    designConstraint SPARouting {
        id: DC_005
        text: "クライアントサイドSPAルーティング（hash history + basename、GitHub Pages 対応）"
        risk: medium
        verifymethod: inspection
    }

    PageNavigation - contains -> TrainingPage
    PageNavigation - contains -> HistoryPage
    PageNavigation - contains -> AIChatPage
    PageNavigation - contains -> BottomNav
    PageNavigation - contains -> GearIcon
    PageNavigation - contains -> SPARouting

    TrainingPage - derives -> SessionPersistence
    AIChatPage - derives -> SessionPersistence
```

---

## 3. 機能要求の詳細

### FR_017: トレーニングページ

アプリのメインページ。セッション状態に応じてFRAME1（Idle）とFRAME2（Active）を切り替える。

- **FRAME1（Idle）**: 挨拶 + 「トレーニングを始める」ボタン。詳細は [workout/index.md](workout/index.md) 参照
- **FRAME2（Active）**: 種目カード一覧 + セット記録。終了ボタンでFRAME1に戻る

**検証方法:** テストによる検証

### FR_018: 履歴ページ（FRAME3）

月表示カレンダー + 選択日の記録サマリー。詳細は [history/index.md](history/index.md) 参照。

**検証方法:** テストによる検証

### FR_019: セッション状態の永続化

BottomNavによるタブ遷移やブラウザリロードでセッションデータが失われないことを保証する。Zustandの`persist`ミドルウェアでlocalStorageに永続化。

**検証方法:** テストによる検証

### FR_020: AIチャットページ（FRAME4）

BottomNavのAIボタンから常時アクセス可能。APIキー未設定時もタップ可能（ページ内で設定を促すUI表示）。詳細は [ai-chat/index.md](ai-chat/index.md) 参照。

**検証方法:** テストによる検証

## 4. インターフェース要求

### IR_001: BottomNav（2タブ + AI専用ボタン）

スマホ画面下部に固定配置。FRAME1〜4で常に表示（FRAME5では非表示）。

**レイアウト:**

```
┌──────────┬──────────┬──────────────────┐
│ Training │ History  │   [ AI ボタン ]   │
└──────────┴──────────┴──────────────────┘
  2タブ（均等 flex-1）   AI 専用ボタン（pill型）
```

**外観:**
- 高さ: セーフエリア込みで十分なタップ領域（T-003 準拠）
- 背景: 半透明フロストガラス（デザイントークン参照）
- 上部: 薄いセパレーター

**タブ状態:**

| 要素 | ラベル | アイコン | アクティブ | 非アクティブ |
|:-----|:-------|:---------|:-----------|:-------------|
| タブ1 | トレ | `ph-barbell` | 塗りつぶし・強調色・太字 | ミュートカラー |
| タブ2 | 履歴 | `ph-clock-counter-clockwise` | 塗りつぶし・強調色・太字 | ミュートカラー |

**AIボタン:**

| 状態 | 背景 | テキスト |
|:-----|:-----|:---------|
| 通常 | 黒背景 | 白テキスト |
| アクティブ（FRAME4表示中） | アクセント色（gym-accent）背景 | 白テキスト |

- 形状: pill 型（`rounded-full`、tokens.md ボーダーラジウス規定「ピル・ヘッダー」準拠）
- アイコン: ロボットアイコン + 「AI」ラベル

**遷移先:**

| 操作 | 遷移先 |
|:-----|:-------|
| トレタブ | FRAME1（Idle）/ FRAME2（セッション中の場合） |
| 履歴タブ | FRAME3 |
| AIボタン | FRAME4 |

**検証方法:** インスペクションによる検証

### IR_002: 歯車アイコン（全画面共通）

全画面（FRAME1〜4）の右上に固定表示される歯車アイコン。タップでFRAME5（設定）へ遷移する。

**外観:**
- 画面右上に固定配置、スクロールしても常に表示
- 丸型ボタン、半透明フロストガラス背景
- アイコン: 歯車（Phosphor Icons `ph-gear`）

**APIキー未設定時のバッジ:**
- 歯車アイコン右上に赤ドットを表示（gym-accent 色）

**FRAME2 での追加要素:**
- 歯車の右隣に「終了」ボタン
- ボタン群の下にタイマー pill

**検証方法:** インスペクションによる検証

## 5. 設計制約

### DC_005: クライアントサイドSPAルーティング

4つの論理ルート（`training`, `history`, `ai`, `settings`）を TanStack Router の hash history モードで管理する。GitHub Pages 対応のため hash ルーティング（`/#/training` 形式）と basename（`/gymini/`）を使用する。

**検証方法:** インスペクションによる検証

---

## 6. フェーズ統合戦略

| Phase | 追加機能 | ナビゲーションへの影響 |
|:------|:---------|:---------------------|
| Phase 1 | ワークアウト CRUD、履歴 | FRAME1/2/3が機能。AIボタンは「準備中」表示 |
| Phase 2 | 設定画面（APIキー・種目管理） | FRAME5追加。歯車アイコン全画面表示 |
| Phase 3 | AIチャット | FRAME4が完全機能。AIボタンのアクティブ状態（accent） |

---

## 7. スコープ外

- HTML5 History API ベースルーティング（GitHub Pages 非対応のため hash routing を採用）
- ディープリンク / ブックマーク対応
- ページ間のトランジションアニメーション
- タブレット / デスクトップ向けレスポンシブレイアウト
