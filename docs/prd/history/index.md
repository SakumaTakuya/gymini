---
id: "prd-history"
title: "履歴画面"
type: "prd"
status: "approved"
created: "2026-04-06"
updated: "2026-05-04"
depends-on: ["prd-gymini", "prd-workout"]
tags: ["history", "calendar", "phase-1"]
category: "view"
priority: "medium"
risk: "low"
---

# 履歴画面 要求仕様書

**親要求:** [index.md](../index.md) - REQ_006

> **統合:** 旧カレンダーPRDの機能要求（FR_013〜FR_016）を本PRDに統合し、履歴画面としての完全な仕様を定義する。

## 概要

月表示カレンダーとワークアウト記録サマリーによる履歴閲覧画面。トレーニングした日を視覚的に把握し、日付選択でその日のセット単位の詳細記録を確認できる。BottomNavの「履歴」タブからアクセスする。

---

## 1. ユースケース図

```mermaid
graph TB
    subgraph "履歴画面"
        User((ユーザー))
        ViewCalendar[月表示カレンダー閲覧]
        NavMonth[前月・次月へ遷移]
        TapDate[日付をタップ]
        ViewSummary[選択日のワークアウト記録を確認]
        ViewEmpty[記録なし状態を確認]
        AddFromHistory[記録なし日からワークアウトを追加]
    end

    User --- ViewCalendar
    User --- NavMonth
    User --- TapDate
    TapDate --> ViewSummary
    TapDate --> ViewEmpty
    ViewEmpty --> AddFromHistory
```

---

## 2. 要求図（SysML Requirements Diagram）

```mermaid
requirementDiagram
    requirement HistoryView {
        id: REQ_006
        text: "履歴画面による記録確認機能"
        risk: low
        verifymethod: demonstration
    }

    functionalRequirement MonthlyCalendar {
        id: FR_013
        text: "月表示カレンダーを表示（前月・次月遷移可能）"
        risk: low
        verifymethod: test
    }

    functionalRequirement TrainingMarker {
        id: FR_014
        text: "トレーニング記録がある日に赤ドットマーカーを表示"
        risk: low
        verifymethod: test
    }

    functionalRequirement DateTapSummary {
        id: FR_015
        text: "日付タップでその日のセット単位の記録サマリーを表示"
        risk: low
        verifymethod: test
    }

    functionalRequirement EmptyState {
        id: FR_026
        text: "記録なし日の空状態表示と追加導線"
        risk: low
        verifymethod: test
    }

    functionalRequirement TodayHighlight {
        id: FR_027
        text: "今日の日付を黒塗りで強調表示"
        risk: low
        verifymethod: test
    }

    functionalRequirement SwipeNavigation {
        id: FR_028
        text: "カレンダー上の左右スワイプで前月・次月へ遷移（指追従＋スナップアニメーション）"
        risk: low
        verifymethod: test
    }

    HistoryView - contains -> MonthlyCalendar
    HistoryView - contains -> TrainingMarker
    HistoryView - contains -> DateTapSummary
    HistoryView - contains -> EmptyState
    HistoryView - contains -> TodayHighlight
    HistoryView - contains -> SwipeNavigation
    DateTapSummary - derives -> EmptyState
    SwipeNavigation - derives -> MonthlyCalendar
```

---

## 3. 機能要求の詳細

### FR_013: 月表示カレンダー

月単位のカレンダーグリッド（7列: 日〜土）を表示する。左右のシェブロンボタンで前月・次月に遷移可能。

**UIスペック:**
- 月ヘッダー: `[<] 2025年10月 [>]`（Outfit Bold）
- 曜日行: 日（accent赤）、月〜土（zinc-400）
- 日付セル: 視覚サイズ `w-9 h-9`（36px）、グリッドセル領域でタップターゲット44px相当を確保（T-003 準拠）

**検証方法:** テストによる検証

### FR_014: トレーニング日マーカー（部位別カラー）

カレンダー上で、ワークアウト記録が存在する日付の下部に、その日に鍛えた部位ごとの色ドットを表示する（最大3個）。部位は種目マスターの `category` から解決する（読み取り時 join）。

**UIスペック:**
- ドット: `w-1 h-1 rounded-full`、色は部位カラー（`src/lib/exerciseCategory.ts` の `CATEGORY_META`）
- 個数: 1日の部位を安定順（CATEGORY_ORDER）でソートし最大3個。4部位以上は先頭2個 + グレーの「他N部位」ドット
- 部位情報が無い日（種目が全て削除済み等）は従来どおり単一のアクセント色ドットにフォールバック
- 記録がある日は日付テキストが `text-black`（なし日は `text-zinc-400`）
- 各ドットに `data-testid="workout-marker"`、コンテナに部位名の `aria-label`

**検証方法:** テストによる検証

### FR_029: 部位カラー凡例

カレンダー下部に、その月に登場した部位の凡例（色ドット + ラベル）を表示する。登場部位が無い月は凡例を非表示にする。

**UIスペック:**
- `data-testid="calendar-legend"`、`aria-label="部位の凡例"`
- 各項目: 色ドット + 日本語ラベル（胸/背中/肩/腕/脚/体幹/有酸素/未分類）

**検証方法:** テストによる検証

### FR_015: 日付タップで記録サマリー表示

カレンダーの日付をタップすると選択状態（リングハイライト）になり、カレンダー下部にその日のワークアウト記録を表示する。

**サマリー表示内容（種目ごと）:**
- 種目名（Outfit Bold）
- セット一覧: `SET1: 100kg × 10回` 形式で各セットの重量と回数を表示

**選択状態UIスペック:**
- リング: `ring-2 ring-black ring-offset-2`
- テキスト: `font-bold text-black`

**検証方法:** テストによる検証

### FR_026: 記録なし日の空状態

選択した日付にワークアウト記録がない場合、空状態UIを表示する。

**UIスペック:**
- ゴーストアイコン（`ph-ghost`）+ 「記録なし」テキスト
- 「追加」ボタン: タップするとFRAME2（Active Workout）へ遷移しその日付でセッション開始
- 破線ボーダー: `border-2 border-dashed border-zinc-200`

**検証方法:** テストによる検証

### FR_027: 今日の日付強調

今日の日付セルを黒塗り背景＋白テキストで他の日付と区別する。

**UIスペック:**
- 背景: `bg-black text-white rounded-full`
- シャドウ: `shadow-md`
- トレーニング記録ありの場合は赤ドットも表示（`border border-black` 付き）

**検証方法:** テストによる検証

### FR_028: スワイプ月遷移

カレンダー上で左右にスワイプ（横ドラッグ）すると前月・次月に遷移できる。

**動作仕様:**
- ドラッグ中はカレンダーが指に追従して水平方向に translate される
- リリース時の水平移動量が閾値（既定 50px）を超えたら遷移を確定し、スライドアニメーション（既定 200ms）でスナップ
- 閾値未満なら元の位置にスナップバック（遷移しない）
- 縦方向の移動が水平を上回った場合は通常の縦スクロールを優先しスワイプ判定を破棄
- 既存の `[<]`/`[>]` ボタンクリックでの月遷移は引き続き同じアニメーションで動作

**遷移方向:**
- 左方向スワイプ（指を左に動かす）→ 次月
- 右方向スワイプ（指を右に動かす）→ 前月

**検証方法:** テストによる検証（Vitest 単体 + 任意で Playwright E2E）

---

## 4. カレンダー日付セルの状態一覧

| 状態 | 見た目 | 操作 |
|:-----|:-------|:-----|
| 記録なし | `text-zinc-400` | タップ → 空状態表示 |
| 記録あり | `text-black` + 部位カラードット（最大3） | タップ → 記録サマリー表示 |
| 今日 | `bg-black text-white` + (赤ドット) | タップ → 記録表示 |
| 選択中 | `ring-2 ring-black ring-offset-2 font-bold` | 現在選択中の日付 |

---

## 5. 画面レイアウト

```
┌─────────────────────────────────┐
│ (sensor notch)                  │
│                          [  ⚙ ]│  ← 固定: 歯車ボタン
│                                 │
│  履歴                           │  ← スクロールコンテンツ
│                                 │
│  ┌────────────────────────────┐ │
│  │  [<]    2025年10月    [>]  │ │
│  │  日  月  火  水  木  金  土 │ │
│  │           1   2   3   4   │ │
│  │   5   6   7   8·  9  10· 11│ │
│  │  12·  ...        ●24  25  │ │  ← ●=今日, ·=トレ日
│  │              ◎20           │ │  ← ◎=選択中
│  └────────────────────────────┘ │
│                                 │
│  10月20日の記録                  │
│  ┌────────────────────────────┐ │
│  │ Bench Press                │ │
│  │ SET1  100kg × 10回         │ │
│  │ SET2  100kg × 8回          │ │
│  │ SET3   95kg × 8回          │ │
│  │────────────────────────────│ │
│  │ Cable Flyes                │ │
│  │ SET1  30kg × 12回          │ │
│  │ SET2  30kg × 10回          │ │
│  └────────────────────────────┘ │
│                                 │
│ [トレ]    [履歴]                │  ← BottomNav（履歴アクティブ・2 タブ）
└─────────────────────────────────┘
```
