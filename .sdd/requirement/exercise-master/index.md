---
id: "prd-exercise-master"
title: "種目マスター管理"
type: "prd"
status: "draft"
created: "2026-03-08"
updated: "2026-04-06"
depends-on: ["prd-gymini"]
tags: ["exercise", "master-data", "phase-1"]
category: "core"
priority: "high"
risk: "high"
---

# 種目マスター管理 要求仕様書

**親要求:** [index.md](../index.md) - REQ_003

## 概要

トレーニング種目のマスターデータを管理する機能。2つの利用コンテキストがある:

1. **FRAME2（Active Workout）**: 種目検索フィールドからの検索・選択・自動登録（FR_005, FR_006）
2. **FRAME5（設定画面）**: 種目一覧の閲覧・編集・追加・削除（FR_007）。画面構成の詳細は [settings/index.md](../settings/index.md) FR_025 を参照

---

## 1. ユースケース図

```mermaid
graph TB
    subgraph "種目マスター管理"
        User((ユーザー))

        subgraph "記録入力時"
            Search[部分一致検索]
            AutoRegister[新規種目として自動登録]
        end

        subgraph "設定画面"
            ListExercises[種目一覧表示]
            ManualAdd[手動追加]
            ManualEdit[編集]
            ManualDelete[手動削除]
        end
    end

    User --- Search
    User --- ListExercises
    User --- ManualAdd
    User --- ManualEdit
    User --- ManualDelete
    AutoRegister -.->|"<<拡張>>"| Search
```

---

## 2. 要求図（SysML Requirements Diagram）

```mermaid
requirementDiagram
    requirement ExerciseMaster {
        id: REQ_003
        text: "種目マスターの管理機能"
        risk: high
        verifymethod: demonstration
    }

    functionalRequirement ExerciseSearch {
        id: FR_005
        text: "テキスト入力で部分一致検索し候補をドロップダウン表示"
        risk: medium
        verifymethod: test
    }

    functionalRequirement ExerciseAutoRegister {
        id: FR_006
        text: "一致しない文字列を新しい種目として自動登録"
        risk: medium
        verifymethod: test
    }

    functionalRequirement ExerciseManualCRUD {
        id: FR_007
        text: "設定画面で種目の一覧表示・手動追加・編集・削除"
        risk: medium
        verifymethod: test
    }

    ExerciseMaster - contains -> ExerciseSearch
    ExerciseMaster - contains -> ExerciseAutoRegister
    ExerciseMaster - contains -> ExerciseManualCRUD
    ExerciseSearch - derives -> ExerciseAutoRegister
```

---

## 3. 機能要求の詳細

### FR_005: 種目検索

記録入力時の種目選択において、テキスト入力による部分一致検索（前方一致・中間一致を含む文字列マッチング）を提供する。入力に応じて候補をドロップダウンで表示する。

**検証方法:** テストによる検証

### FR_006: 種目の自動登録

検索で一致する種目がない場合、入力した文字列を「"XX" を新しい種目として追加」という選択肢として表示する。選択すると種目マスターに自動登録される。

**検証方法:** テストによる検証

### FR_007: 種目マスターの手動管理

設定画面（FRAME5）で登録済み種目の一覧表示、手動での追加・編集・削除ができる。

**UIスペック（FRAME5の種目マスターセクション）:**
- 検索: リアルタイム絞り込み
- 種目行: 名前 + 編集ボタン（鉛筆アイコン `ph-pencil-simple`）
- 追加: `+` アイコン + 「種目を追加」ラベル

**検証方法:** テストによる検証
