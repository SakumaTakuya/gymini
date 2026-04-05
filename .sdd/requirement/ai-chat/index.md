---
id: "prd-ai-chat"
title: "AIチャット × Function Calling"
type: "prd"
status: "draft"
created: "2026-03-08"
updated: "2026-04-06"
depends-on: ["prd-gymini", "prd-api-key", "prd-workout", "prd-exercise-master", "prd-navigation"]
tags: ["ai", "chat", "function-calling", "gemini", "phase-3"]
category: "ai"
priority: "high"
risk: "high"
---

# AIチャット × Function Calling 要求仕様書

**親要求:** [index.md](../index.md) - REQ_005

## 概要

Gemini APIを用いたチャットインターフェースを提供し、AIが会話の文脈からワークアウトデータを参照・操作するFunction Callingツールを自律的に呼び出す。書き込み操作にはユーザー確認を必須とする（REQ_008）。

---

## 1. ユースケース図

```mermaid
graph TB
    subgraph "AIチャット"
        User((ユーザー))
        SendMessage[メッセージ送信]
        ReceiveAdvice[アドバイス受信]

        subgraph "Function Calling"
            GetRecent[最新ワークアウト取得]
            GetByExercise[種目別ワークアウト取得]
            GetByDate[日付別ワークアウト取得]
            GetSummary[集計取得]
            SaveWorkout[会話から記録保存]
            GetExercises[種目一覧取得]
            AddExercise[種目追加]
        end
    end

    User --- SendMessage
    User --- ReceiveAdvice
    SendMessage -.->|"<<包含>>"| GetRecent
    SendMessage -.->|"<<包含>>"| GetByExercise
    SendMessage -.->|"<<包含>>"| GetByDate
    SendMessage -.->|"<<包含>>"| GetSummary
    SendMessage -.->|"<<包含>>"| SaveWorkout
    SendMessage -.->|"<<包含>>"| GetExercises
    SendMessage -.->|"<<包含>>"| AddExercise
```

---

## 2. 要求図（SysML Requirements Diagram）

```mermaid
requirementDiagram
    requirement AIChatCoaching {
        id: REQ_005
        text: "AIチャットによるコーチング機能"
        risk: high
        verifymethod: demonstration
    }

    functionalRequirement ChatConversation {
        id: FR_011
        text: "Gemini APIを用いたチャット会話"
        risk: high
        verifymethod: test
    }

    functionalRequirement FunctionCalling {
        id: FR_012
        text: "AIが会話の文脈から必要なツールを自律的に呼び出す"
        risk: high
        verifymethod: test
    }

    functionalRequirement ToolGetRecentWorkouts {
        id: FR_012_01
        text: "最新n件のワークアウトを取得するツール"
        risk: medium
        verifymethod: test
    }

    functionalRequirement ToolGetByExercise {
        id: FR_012_02
        text: "種目名で部分一致絞り込みするツール"
        risk: medium
        verifymethod: test
    }

    functionalRequirement ToolGetByDate {
        id: FR_012_03
        text: "日付指定でワークアウトを取得するツール"
        risk: medium
        verifymethod: test
    }

    functionalRequirement ToolGetSummary {
        id: FR_012_04
        text: "週・月単位のワークアウト集計ツール"
        risk: medium
        verifymethod: test
    }

    functionalRequirement ToolSaveWorkout {
        id: FR_012_05
        text: "会話からワークアウト記録を保存するツール（ユーザー確認必須）"
        risk: high
        verifymethod: test
    }

    functionalRequirement ToolGetExercises {
        id: FR_012_06
        text: "登録済み種目一覧を取得するツール"
        risk: low
        verifymethod: test
    }

    functionalRequirement ToolAddExercise {
        id: FR_012_07
        text: "種目マスターに新規追加するツール（ユーザー確認必須）"
        risk: low
        verifymethod: test
    }

    functionalRequirement ToolAddExerciseToSession {
        id: FR_012_08
        text: "アクティブセッションに種目を追加するツール（ユーザー確認必須・インラインUI）"
        risk: high
        verifymethod: test
    }

    requirement AIWriteConfirmation {
        id: REQ_008
        text: "AIが書き込み操作を実行する前にチャットバブル内のインラインUIでユーザー確認を求める"
        risk: high
        verifymethod: test
    }

    AIChatCoaching - contains -> ChatConversation
    AIChatCoaching - contains -> FunctionCalling
    AIChatCoaching - contains -> AIWriteConfirmation
    FunctionCalling - contains -> ToolGetRecentWorkouts
    FunctionCalling - contains -> ToolGetByExercise
    FunctionCalling - contains -> ToolGetByDate
    FunctionCalling - contains -> ToolGetSummary
    FunctionCalling - contains -> ToolSaveWorkout
    FunctionCalling - contains -> ToolGetExercises
    FunctionCalling - contains -> ToolAddExercise
    FunctionCalling - contains -> ToolAddExerciseToSession
```

---

## 3. 機能要求の詳細

### FR_011: AIチャット会話

Gemini APIを用いたチャットインターフェースを提供する。ユーザーのBYOK APIキーを使ってGemini APIに接続する。

**デザインリファレンス:** `.sdd/design-system.html` FRAME4

**チャットバブルUIスペック:**

| バブル種別 | 配置 | 背景 | 角丸 | max-width |
|:-----------|:-----|:-----|:-----|:----------|
| ユーザーメッセージ | 右寄せ | `bg-black text-white` | `rounded-[18px] rounded-br-[4px]` | 75% |
| AI返答（読み取り操作後） | 左寄せ | `bg-white border-zinc-100 shadow-soft` | `rounded-[18px] rounded-bl-[4px]` | 88% |
| AI確認待ち（書き込み操作） | 左寄せ | `bg-white border-zinc-200 shadow-soft` | `rounded-[18px] rounded-bl-[4px]` | 88% |

- AIメッセージにアバターアイコンは表示しない（幅節約）
- 入力バー: BottomNavの上に固定（`bottom: 96px`）、丸角テキスト入力 + 送信ボタン

**検証方法:** テストによる検証

### FR_012: Function Calling

AIが会話の文脈を解析し、必要に応じて以下のツールを自律的に呼び出す。

**含まれるツール:**

| ツール | 説明 | 操作種別 |
|--------|------|----------|
| 最新ワークアウト取得 | 最新n件のワークアウトを取得 | 読み取り |
| 種目別ワークアウト取得 | 種目名で部分一致絞り込み | 読み取り |
| 日付別ワークアウト取得 | 日付指定で取得 | 読み取り |
| ワークアウト集計 | 週・月単位の集計 | 読み取り |
| ワークアウト保存 | 会話から記録を保存 | 書き込み（要確認） |
| 種目一覧取得 | 登録済み種目一覧を取得 | 読み取り |
| 種目追加 | 種目マスターに追加 | 書き込み（要確認） |
| セッションへの種目追加 | アクティブセッションに種目を追加 | 書き込み（要確認） |

**検証方法:** テストによる検証

### REQ_008: AI書き込み操作のユーザー確認（インラインUI）

AIが書き込み操作（ワークアウト保存・種目追加・セッションへの種目追加）を実行する際、実行前にユーザーに確認を求める。読み取り操作（データ取得・集計）はユーザー確認なしで自律的に実行できる。

**確認UIの表示形式:**

- 確認UIはチャットのメッセージバブル内にインラインで表示する（別モーダルや別ダイアログは使用しない）
- AI メッセージの直下に「実行する」「キャンセル」ボタンをバブル内に配置する
- ユーザーが確認後、AI は結果をチャット内で報告する

**例（セッションへの種目追加）:**

```
AI: 「スクワットを今日のセッションに追加しますか？」
    [追加する]  [キャンセル]   ← バブル内インラインボタン
```

**インラインボタンUIスペック:**
- キャンセル: `bg-zinc-100 text-black font-semibold rounded-xl h-9`
- 実行（追加する等）: `bg-black text-white font-bold rounded-xl h-9` + アイコン
- 2ボタンを `flex gap-2` で横並び、各 `flex-1`

**検証方法:** テストによる検証
