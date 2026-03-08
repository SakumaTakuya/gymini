---
id: "prd-workout"
title: "ワークアウト記録管理"
type: "prd"
status: "draft"
created: "2026-03-08"
updated: "2026-03-08"
depends-on: ["prd-gymini"]
tags: ["workout", "crud", "phase-1"]
category: "core"
priority: "high"
risk: "high"
---

# ワークアウト記録管理 要求仕様書

**親要求:** [index.md](../index.md) - REQ_002

## 概要

ユーザーが日々のトレーニング内容を記録・管理する中核機能。ワークアウトは日付に紐づき、複数の種目とセットで構成される。

---

## 1. ユースケース図

```mermaid
graph TB
    subgraph "ワークアウト記録"
        User((ユーザー))
        AddWorkout[ワークアウト追加]
        EditWorkout[ワークアウト編集]
        DeleteWorkout[ワークアウト削除]
        ListWorkout[ワークアウト一覧表示]

        subgraph "種目選択"
            Search[部分一致検索]
            AddNewExercise[新規種目として追加]
        end
    end

    User --- AddWorkout
    User --- EditWorkout
    User --- DeleteWorkout
    User --- ListWorkout
    Search -.->|"<<拡張>>"| AddWorkout
    AddNewExercise -.->|"<<拡張>>"| Search
```

---

## 2. 要求図（SysML Requirements Diagram）

```mermaid
requirementDiagram
    requirement WorkoutManagement {
        id: REQ_002
        text: "ワークアウト記録の管理機能"
        risk: high
        verifymethod: demonstration
    }

    functionalRequirement WorkoutCRUD {
        id: FR_001
        text: "ワークアウトの追加・編集・削除"
        risk: high
        verifymethod: test
    }

    functionalRequirement WorkoutList {
        id: FR_002
        text: "ワークアウト一覧を日付降順で表示"
        risk: high
        verifymethod: test
    }

    functionalRequirement SetManagement {
        id: FR_003
        text: "セット単位で重量kg・回数・メモを管理"
        risk: high
        verifymethod: test
    }

    functionalRequirement WorkoutMemo {
        id: FR_004
        text: "ワークアウト全体のメモを記録"
        risk: low
        verifymethod: test
    }

    WorkoutManagement - contains -> WorkoutCRUD
    WorkoutManagement - contains -> WorkoutList
    WorkoutManagement - contains -> SetManagement
    WorkoutManagement - contains -> WorkoutMemo
```

---

## 3. 機能要求の詳細

### FR_001: ワークアウトの追加・編集・削除

ユーザーはワークアウト記録を新規作成、既存記録の編集、および削除ができる。ワークアウトは日付に紐づき、複数のセットと種目を含む。

**検証方法:** テストによる検証

### FR_002: ワークアウト一覧表示

ワークアウト一覧を日付降順（新しい順）で表示する。各ワークアウトには日付・種目・セット情報のサマリーが表示される。

**検証方法:** テストによる検証

### FR_003: セット単位の管理

各ワークアウト内でセット単位のデータを管理する。1セットは以下の情報を持つ:
- 重量（kg）
- 回数（reps）
- メモ（任意）

**検証方法:** テストによる検証

### FR_004: ワークアウト全体のメモ

ワークアウト単位で自由記述のメモを記録できる。体調やトレーニング環境などの補足情報を残すための機能。

**検証方法:** テストによる検証
