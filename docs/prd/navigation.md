---
id: "prd-navigation"
title: "ページナビゲーション"
type: "prd"
status: "draft"
created: "2026-03-28"
updated: "2026-05-09"
depends-on: ["prd-gymini", "prd-workout", "prd-history", "prd-ai-chat", "prd-settings"]
tags: ["navigation", "routing", "bottom-nav"]
category: "ui"
priority: "high"
risk: "medium"
---

# ページナビゲーション 要求仕様書

**親要求:** [index.md](index.md) - REQ_007 (UI Design), IR_001 (ナビゲーション)

**関連要求:** [app-header.md](app-header.md) - 全画面共通の上部 chrome（タイトル・leading/trailing slot）

**デザインリファレンス:** `.sdd/design-system.html` 全FRAME共通

## 概要

gymini のページナビゲーションアーキテクチャを定義する。

- **BottomNav**: 2タブ（Training + History）。AI 対話はワークアウトセッション内のタイムライン UX に統合されたため、独立した AI タブは持たない（[ai-chat/index.md](ai-chat/index.md) FR_034）
- **歯車アイコン**: 全画面の右上に固定、タップで設定画面へ遷移
- **ルーティング**: 4つの論理画面（FRAME1, FRAME2, FRAME3, FRAME5）をクライアントサイドで管理。旧 FRAME4（独立 AI チャット画面）は段階的に撤去される（[ai-chat/timeline-migration.md](ai-chat/timeline-migration.md) Phase 8）

---

## 1. 画面遷移図

```mermaid
graph TB
    subgraph "gymini ナビゲーション"
        User((ユーザー))
        FRAME1["FRAME1: Training Idle"]
        FRAME2["FRAME2: Active Workout (タイムライン UX: 種目 + AI 対話統合)"]
        FRAME3["FRAME3: History"]
        FRAME5["FRAME5: Settings"]
    end

    User -->|"トレーニングを始める"| FRAME1
    FRAME1 -->|"セッション開始"| FRAME2
    FRAME2 -->|"終了ボタン"| FRAME1

    FRAME1 <-->|"BottomNav: 履歴タブ"| FRAME3
    FRAME2 <-->|"BottomNav: 履歴タブ"| FRAME3

    FRAME1 -->|"歯車アイコン"| FRAME5
    FRAME2 -->|"歯車アイコン"| FRAME5
    FRAME3 -->|"歯車アイコン"| FRAME5
    FRAME5 -->|"Xボタン"| FRAME5_PREV["遷移元に戻る"]
```

旧 FRAME4（独立 AI チャット画面）への遷移は撤去。AI 対話は FRAME2 のタイムライン内でのみ成立する。

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

    functionalRequirement AIChatIntegration {
        id: FR_020
        text: "AI 対話はワークアウトセッション（FRAME2）のタイムライン UX に統合され、独立した画面を持たない"
        risk: high
        verifymethod: test
    }

    interfaceRequirement BottomNav {
        id: IR_001
        text: "2タブ（Training + History）の BottomNav。AI 専用タブは廃止"
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
    PageNavigation - contains -> AIChatIntegration
    PageNavigation - contains -> BottomNav
    PageNavigation - contains -> GearIcon
    PageNavigation - contains -> SPARouting

    TrainingPage - derives -> SessionPersistence
    AIChatIntegration - traces -> TrainingPage
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

### FR_020: AI 対話のセッション統合

AI 対話は独立した画面（旧 FRAME4）を持たず、ワークアウトセッション（FRAME2）のタイムライン UX 内でのみ成立する。

- AI への発話導線はセッション中の単一入力欄に集約される（[ai-chat/index.md](ai-chat/index.md) FR_035）
- セッション非アクティブ時は AI と対話できない（防御的に書き込みツールも `SESSION_NOT_ACTIVE` を返す: FR_036）
- 旧 `/ai` ルート / FRAME4 / BottomNav 「AI」専用ボタンは段階的に撤去される（[ai-chat/timeline-migration.md](ai-chat/timeline-migration.md) Phase 8）
- APIキー未設定時の導線は FRAME5 設定画面に集約（IR_002 歯車アイコンの赤バッジ）

**検証方法:** テストによる検証

## 4. インターフェース要求

### IR_001: BottomNav（2タブ構成）

スマホ画面下部に固定配置。FRAME1〜3 で常に表示（FRAME5 では非表示）。

**レイアウト:**

```
┌────────────────┬────────────────┐
│    Training    │     History    │
└────────────────┴────────────────┘
       2タブ（均等 flex-1）
```

旧 AI 専用ボタンは撤去。AI 対話は FRAME2 のタイムライン内のみで成立する（FR_020）。

**UIスペック:**
- 高さ: `h-24`（セーフエリア含む）
- 背景: `bg-gym-white/80 backdrop-blur-xl`
- ボーダー: `border-t border-gym-zinc-200/50`

**タブ状態:**

| 要素 | ラベル | アイコン | アクティブ | 非アクティブ |
|:-----|:-------|:---------|:-----------|:-------------|
| タブ1 | トレ | `ph-barbell` | `ph-fill text-gym-black font-bold` | `text-gym-zinc-400 font-medium` |
| タブ2 | 履歴 | `ph-clock-counter-clockwise` | `ph-fill text-gym-black font-bold` | `text-gym-zinc-400 font-medium` |

**遷移先:**

| 操作 | 遷移先 |
|:-----|:-------|
| トレタブ | FRAME1（Idle）/ FRAME2（セッション中の場合） |
| 履歴タブ | FRAME3 |

**検証方法:** インスペクションによる検証

### IR_002: 歯車アイコン（全画面共通）

全画面（FRAME1〜FRAME3）の右上に固定表示される歯車アイコン。タップでFRAME5（設定）へ遷移する。

**UIスペック:**
- 位置: `absolute top-12 right-4 z-30`
- サイズ: `w-9 h-9`
- スタイル: `bg-white/80 backdrop-blur-sm rounded-full shadow-sm border-zinc-100`
- アイコン: `ph-gear text-base text-zinc-500`

**APIキー未設定時のバッジ:**
- 赤ドット: `w-3 h-3 bg-accent rounded-full`
- 位置: `absolute top-[-2px] right-[-2px]`

**FRAME2での追加要素:**
- 歯車の右隣に「終了」ボタン
- ボタン群の下にタイマーpill

**検証方法:** インスペクションによる検証

## 5. 設計制約

### DC_005: クライアントサイドSPAルーティング

3つの論理ルート（`training`, `history`, `settings`）を TanStack Router の hash history モードで管理する。GitHub Pages 対応のため hash ルーティング（`/#/training` 形式）と basename（`/gymini/`）を使用する。

旧 `ai` ルートは段階的に撤去される（[ai-chat/timeline-migration.md](ai-chat/timeline-migration.md) Phase 8）。移行期間中は `/ai` を `/training` へリダイレクト、または「セッション開始へ誘導する空ページ」として残置する。

**検証方法:** インスペクションによる検証

---

## 6. フェーズ統合戦略

| Phase | 追加機能 | ナビゲーションへの影響 |
|:------|:---------|:---------------------|
| Phase 1 | ワークアウト CRUD、履歴 | FRAME1/2/3が機能。AI 機能は未提供 |
| Phase 2 | 設定画面（APIキー・種目管理） | FRAME5 追加。歯車アイコン全画面表示 |
| Phase 3（旧）| 独立 AI チャット画面 | FRAME4 を一時的に追加（AI ボタン経由）。**Phase 4 で撤去** |
| Phase 4 | タイムライン統合 UX | FRAME2 に AI 対話を統合。FRAME4 と AI 専用ボタンを撤去（[ai-chat/timeline-migration.md](ai-chat/timeline-migration.md) Phase 1〜8）|

---

## 7. スコープ外

- HTML5 History API ベースルーティング（GitHub Pages 非対応のため hash routing を採用）
- ディープリンク / ブックマーク対応
- ページ間のトランジションアニメーション
- タブレット / デスクトップ向けレスポンシブレイアウト
