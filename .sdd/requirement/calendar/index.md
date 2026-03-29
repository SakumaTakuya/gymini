---
id: "prd-calendar"
title: "カレンダー表示"
type: "prd"
status: "draft"
created: "2026-03-08"
updated: "2026-03-08"
depends-on: ["prd-gymini", "prd-workout"]
tags: ["calendar", "phase-1"]
category: "view"
priority: "low"
risk: "low"
---

# カレンダー表示 要求仕様書

**親要求:** [index.md](../index.md) - REQ_006

> **統合済み:** 本PRDの機能要求（FR_013〜FR_016）は [navigation.md](../navigation.md) の FR_018（履歴ページ）に統合されました。本ドキュメントは個別要求の詳細定義として引き続き参照されます。

## 概要

月表示カレンダーによるワークアウト記録の確認機能。トレーニングした日を視覚的に把握し、日付からワークアウト記録の閲覧・追加ができる。

---

## 1. ユースケース図

```mermaid
graph TB
    subgraph "カレンダー"
        User((ユーザー))
        ViewMonth[月表示カレンダー閲覧]
        TapDate[日付タップ]
        ViewRecord[その日の記録表示]
        AddWorkout[ワークアウト追加]
    end

    User --- ViewMonth
    User --- TapDate
    TapDate --> ViewRecord
    TapDate --> AddWorkout
```

---

## 2. 要求図（SysML Requirements Diagram）

```mermaid
requirementDiagram
    requirement CalendarView {
        id: REQ_006
        text: "カレンダーによる記録確認機能"
        risk: low
        verifymethod: demonstration
    }

    functionalRequirement MonthlyCalendar {
        id: FR_013
        text: "月表示カレンダーを表示"
        risk: low
        verifymethod: test
    }

    functionalRequirement TrainingMarker {
        id: FR_014
        text: "トレーニングした日にマーカーを表示"
        risk: low
        verifymethod: test
    }

    functionalRequirement DateTapView {
        id: FR_015
        text: "日付タップでその日の記録を表示"
        risk: low
        verifymethod: test
    }

    functionalRequirement DateTapAdd {
        id: FR_016
        text: "日付タップからワークアウト追加が可能"
        risk: low
        verifymethod: test
    }

    CalendarView - contains -> MonthlyCalendar
    CalendarView - contains -> TrainingMarker
    CalendarView - contains -> DateTapView
    CalendarView - contains -> DateTapAdd
    DateTapView - derives -> DateTapAdd
```

---

## 3. 機能要求の詳細

### FR_013: 月表示カレンダー

月単位のカレンダーUIを表示する。前月・次月への遷移が可能。

**検証方法:** テストによる検証

### FR_014: トレーニング日マーカー

カレンダー上で、ワークアウト記録が存在する日付にマーカー（ドットやハイライト）を表示する。

**検証方法:** テストによる検証

### FR_015: 日付タップで記録表示

カレンダーの日付をタップすると、その日のワークアウト記録を表示する。

**検証方法:** テストによる検証

### FR_016: 日付タップからワークアウト追加

カレンダーの日付タップ時の記録表示画面から、その日付で新しいワークアウトを追加できる。

**検証方法:** テストによる検証
