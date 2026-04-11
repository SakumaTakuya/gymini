---
id: "spec-exercise-master"
title: "種目マスター管理"
type: "spec"
status: "draft"
sdd-phase: "specify"
created: "2026-03-28"
updated: "2026-04-11"
depends-on: ["prd-exercise-master"]
tags: ["exercise", "master-data", "phase-1"]
category: "core"
priority: "high"
risk: "high"
---

# 種目マスター管理

**関連 Design Doc:** [index_design.md](index_design.md)
**関連 PRD:** [index.md](../../requirement/exercise-master/index.md)

---

# 1. 背景

gymini の Phase 1 中核機能。トレーニング種目のマスターデータを管理し、ワークアウト記録時の種目選択と設定画面での手動管理を提供する。

ワークアウト記録（[index_spec.md](../workout/index_spec.md)）は種目マスターの `exerciseId` と `exerciseName` を参照しており、種目マスターはアプリ全体のマスターデータ基盤となる。また、Phase 3 の AI コーチング機能がユーザーのトレーニング種目一覧を読み取るため、外部モジュールから利用可能な公開インターフェースが必要となる。

# 2. 概要

種目マスター管理機能は以下の責務を持つ：

- **種目検索**: テキスト入力による部分一致検索で候補を表示する
- **種目の自動登録**: 検索で一致しない場合、入力した文字列を新しい種目として登録する
- **一覧表示**: 設定画面で登録済みの種目一覧を表示する
- **手動管理**: 設定画面から種目の追加・編集（名前変更）・削除を行う

本モジュールは独立したデータ管理モジュールであり、ワークアウトモジュール（[index_spec.md](../workout/index_spec.md)）や設定画面（[index_spec.md](../settings/index_spec.md)）、将来の AI モジュールから利用される。他のドメインモジュールには依存しない。

# 3. 要求定義

## 3.1. 機能要件

| ID | 要件 | 優先度 | PRD参照 | 検証方法 |
|----|------|--------|---------|---------|
| FR-005 | テキスト入力で部分一致検索（前方一致・中間一致を含む文字列マッチング）し、候補をドロップダウン表示する | 必須 | FR_005 | テスト |
| FR-006 | 検索で一致する種目がない場合、「"XX" を新しい種目として追加」という選択肢を表示し、選択すると種目マスターに自動登録する | 必須 | FR_006 | テスト |
| FR-007 | 設定画面で登録済み種目の一覧表示、リアルタイム検索絞り込み、手動での追加・編集（名前変更）・削除ができる | 必須 | FR_007 | テスト |

## 3.2. 非機能要件

| ID | カテゴリ | 要件 | 目標値 |
|----|--------|------|--------|
| NFR-001 | データ整合性 | 種目名は一意であること（重複登録を防止する）。一意性の判定は大文字小文字を区別する（case-sensitive）。ただし検索（search）は case-insensitive | create / update 時に一意性を保証 |
| NFR-002 | 操作性 | 検索結果が体感できる遅延なく表示されること | 一般的なデータ量（数百件以下）で 100ms 以内 |

# 4. API

種目マスター機能が外部（他モジュール・UIレイヤー）に公開するインターフェース。ExerciseRepository は関数の集合であり、クラスやオブジェクトではない。各メンバーは独立したエクスポート関数として実装される（詳細は Design Doc を参照）。

| モジュール | インターフェース | メンバー | 概要 |
|---------|--------------|--------|------|
| exercise | ExerciseRepository | getAll() | 登録済みの全種目を取得する |
| exercise | ExerciseRepository | search(query) | 部分一致検索（大文字小文字を区別しない）で一致する種目を返す。query が空文字列または空白のみの場合は全件返す |
| exercise | ExerciseRepository | create(name) | 新しい種目を登録する。登録した Exercise を返す。name が空文字列または空白のみの場合、または名前が重複する場合は例外をスローする |
| exercise | ExerciseRepository | update(id, name) | 指定 ID の種目名を変更する。変更後の Exercise を返す。name が空文字列または空白のみの場合、名前が重複する場合・ID が存在しない場合は例外をスローする |
| exercise | ExerciseRepository | remove(id) | 指定 ID の種目を削除する。存在しない ID の場合は何もしない（冪等）。（`delete` は JS 予約語のため `remove` を使用） |

## 4.1. 型定義

```typescript
// 種目マスターエントリ
type Exercise = {
  id: string            // 一意識別子（自動生成）
  name: string          // 種目名（一意、ユーザー定義）
}
```

# 5. 用語集

| 用語 | 説明 |
|------|------|
| 種目 (Exercise) | トレーニング運動の種類（例: ベンチプレス、スクワット、デッドリフト） |
| 種目マスター | アプリに登録されている種目の一覧。ユーザーが自由に追加・編集・削除できる |
| 自動登録 | ワークアウト記録時に検索で一致しない種目名を選択操作で種目マスターに登録するフロー |

# 6. 使用例

## シナリオ1: ワークアウト記録時の検索と自動登録（FR-005, FR-006）

```
# 検索で候補が見つかる場合
1. ユーザーが種目検索フィールドに「ベンチ」と入力
2. results = ExerciseRepository.search("ベンチ")
   → [{ id: "xxx", name: "ベンチプレス" }]
3. ドロップダウンに「ベンチプレス」が表示される
4. ユーザーが「ベンチプレス」を選択 → 現在のワークアウトエントリに種目がセットされる

# 検索で候補が見つからない場合（自動登録）
5. ユーザーが「インクラインダンベルカール」と入力
6. results = ExerciseRepository.search("インクラインダンベルカール")
   → []（一致なし）
7. ドロップダウンに「"インクラインダンベルカール" を新しい種目として追加」が表示される
8. ユーザーがその選択肢を選択
9. newExercise = ExerciseRepository.create("インクラインダンベルカール")
   → { id: "generated-id", name: "インクラインダンベルカール" }
10. newExercise が現在のワークアウトエントリの種目としてセットされる
```

## シナリオ2: 設定画面での手動管理（FR-007）

```
# 種目一覧の表示
1. exercises = ExerciseRepository.getAll()
   → [{ id: "xxx", name: "ベンチプレス" }, { id: "yyy", name: "スクワット" }, ...]
2. 種目リストを表示

# リアルタイム検索絞り込み
3. ユーザーが検索フィールドに「ベンチ」と入力
4. filtered = ExerciseRepository.search("ベンチ")
   → [{ id: "xxx", name: "ベンチプレス" }]
5. 種目リストがフィルタ結果のみに更新される

# 手動追加
6. ユーザーが「ブルガリアンスクワット」と入力し追加ボタンをタップ
7. newExercise = ExerciseRepository.create("ブルガリアンスクワット")
8. リストが更新され、新しい種目が表示される

# 編集（名前変更）
9. ユーザーが「ブルガリアンスクワット」の編集ボタンをタップ
10. 名前を「ブルガリアンスプリットスクワット」に変更
11. updated = ExerciseRepository.update(exercise.id, "ブルガリアンスプリットスクワット")
12. リストが更新され、変更された名前が表示される

# 手動削除
13. ユーザーが「ブルガリアンスプリットスクワット」の削除ボタンをタップ
14. ExerciseRepository.remove(exercise.id)
15. リストが更新され、削除した種目が非表示になる

# AI が種目一覧を参照する場合（Phase 3、読み取り専用）
16. allExercises = ExerciseRepository.getAll()
    // AI コーチング機能がコンテキストとして利用する
```

# 7. 振る舞い図

## ワークアウト記録時の検索・自動登録フロー（FR-005, FR-006）

```mermaid
sequenceDiagram
    participant User
    participant WorkoutForm
    participant ExerciseRepository

    User->>WorkoutForm: 種目検索フィールドに入力
    WorkoutForm->>ExerciseRepository: search(query)
    ExerciseRepository-->>WorkoutForm: Exercise[]（検索結果）

    alt 候補あり
        WorkoutForm-->>User: ドロップダウンに候補を表示
        User->>WorkoutForm: 種目を選択
        WorkoutForm->>WorkoutForm: 選択した種目をワークアウトエントリにセット
    else 候補なし（FR-006）
        WorkoutForm-->>User: 「"XX" を新しい種目として追加」を表示
        User->>WorkoutForm: 「新規追加」を選択
        WorkoutForm->>ExerciseRepository: create(name)
        ExerciseRepository-->>WorkoutForm: 新しい Exercise
        WorkoutForm->>WorkoutForm: 新しい種目をワークアウトエントリにセット
    end
```

## 設定画面での手動管理フロー（FR-007）

```mermaid
sequenceDiagram
    participant User
    participant SettingsUI as 設定画面（種目マスターセクション）
    participant ExerciseRepository

    User->>SettingsUI: 種目マスター設定を開く
    SettingsUI->>ExerciseRepository: getAll()
    ExerciseRepository-->>SettingsUI: Exercise[]
    SettingsUI-->>User: 種目一覧を表示

    alt リアルタイム検索
        User->>SettingsUI: 検索フィールドに入力
        SettingsUI->>ExerciseRepository: search(query)
        ExerciseRepository-->>SettingsUI: フィルタ済み Exercise[]
        SettingsUI-->>User: 絞り込まれた一覧を表示
    else 手動追加
        User->>SettingsUI: 種目名を入力し「追加」をタップ
        SettingsUI->>ExerciseRepository: create(name)
        ExerciseRepository-->>SettingsUI: 新しい Exercise
        SettingsUI-->>User: 更新された一覧を表示
    else 編集（名前変更）
        User->>SettingsUI: 種目の編集ボタンをタップ
        User->>SettingsUI: 新しい名前を入力し確定
        SettingsUI->>ExerciseRepository: update(id, name)
        ExerciseRepository-->>SettingsUI: 更新された Exercise
        SettingsUI-->>User: 更新された一覧を表示
    else 手動削除
        User->>SettingsUI: 種目の「削除」をタップ
        SettingsUI->>ExerciseRepository: remove(id)
        note over ExerciseRepository,SettingsUI: remove は void を返す（冪等）
        SettingsUI-->>User: 更新された一覧を表示
    end
```

# 8. 制約事項

- 種目名は一意でなければならない（大文字小文字を区別する）。重複する名前での登録・変更はエラーとなる。なお、search() による検索は大文字小文字を区別しない（検索ヒット率優先）
- ワークアウト記録（WorkoutExercise）に保存される `exerciseName` は記録時のスナップショットである。種目マスターで種目が編集（名前変更）・削除されても、既存のワークアウト記録は影響を受けない（ワークアウト仕様書の制約事項を継承）
- 種目データはブラウザの localStorage に永続化される（A-002: Client-Only Architecture）
- localStorage アクセスおよび JSON パースのエラーは適切にハンドリングし、フォールバック値（空配列）を返すこと（T-002: No Runtime Errors）
- Phase 3 の AI コーチング機能は `getAll()` および `search()` を通じて種目マスターを読み取り専用で参照する。AI による書き込み操作（`create`, `update`, `remove`）は B-002（AI安全操作の確認優先）に基づきユーザー確認が必要。読み取り専用操作は確認不要

---

## PRD整合性確認

| PRD要求ID | 要件 | Spec対応箇所 |
|----------|------|------------|
| FR_005 | テキスト入力で部分一致検索し候補をドロップダウン表示 | FR-005, ExerciseRepository.search(), Section 7 振る舞い図（検索フロー） |
| FR_006 | 一致しない文字列を新しい種目として自動登録 | FR-006, ExerciseRepository.create(), Section 7 振る舞い図（候補なし alt） |
| FR_007 | 設定画面で種目の一覧表示・手動追加・編集・削除 | FR-007, ExerciseRepository.getAll()/create()/update()/remove(), Section 7 振る舞い図（設定画面フロー） |

### CONSTITUTION.md 原則準拠

| 原則ID | 原則名 | 準拠状況 |
|--------|--------|---------|
| A-002 | Client-Only Architecture | 準拠: データ永続化は localStorage のみ（Section 8） |
| B-001 | Privacy-by-Design | 準拠: 外部サーバーへのデータ送信なし |
| B-002 | AI安全操作の確認優先 | 準拠: AI 書き込み操作はユーザー確認必須（Section 8） |
| T-001 | TypeScript Strict Mode | 準拠: 型定義は Exercise 型で型安全を保証 |
