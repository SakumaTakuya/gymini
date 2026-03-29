---
id: "impl-exercise-master"
title: "種目マスター管理 実装ログ"
type: "implementation"
status: "completed"
sdd-phase: "implement"
created: "2026-03-29"
updated: "2026-03-29"
completed: "2026-03-29"
depends-on: ["design-exercise-master"]
tags: ["exercise", "master-data", "phase-1"]
---

# 種目マスター管理 実装ログ

## 実装サマリー

| 項目 | 内容 |
|:---|:---|
| 開始日 | 2026-03-29 |
| 完了日 | 2026-03-29 |
| テスト数 | 102（ユニット） + 7（E2E） |
| ブランチ | claude/generate-exercise-spec-g2RoE |

## Phase 進捗

| Phase | 状態 | タスク |
|:---|:---|:---|
| Phase 1: 基盤 | 完了 | 1.1 getAll export, 1.2 create, 1.3 remove |
| Phase 2: コア | 完了 | 2.1 useExerciseMaster Hook, 2.2 ExerciseMasterPage, 2.3 TrainingPage auto-register |
| Phase 3: 統合 | 完了 | 3.1 Navigation integration, 3.2 AddExerciseModal auto-register |
| Phase 4: E2E | 完了 | 4.1 設定画面テスト, 4.2 自動登録テスト |
| Phase 5: 仕上げ | 完了 | 5.1 設計書ステータス更新 |

## 作成・変更ファイル

| ファイル | 操作 | 説明 |
|:---|:---|:---|
| `src/lib/exerciseRepository.ts` | 変更 | `getAll` export, `create`, `remove` 追加 |
| `src/lib/exerciseRepository.test.ts` | 変更 | 12テスト（getAll 3, create 3, remove 2, search 4） |
| `src/hooks/useExerciseMaster.ts` | 新規 | Hook: exercises, addExercise, removeExercise, error |
| `src/hooks/useExerciseMaster.test.ts` | 新規 | 5テスト |
| `src/pages/ExerciseMasterPage.tsx` | 新規 | 設定画面UI |
| `src/pages/ExerciseMasterPage.test.tsx` | 新規 | 6テスト |
| `src/pages/TrainingPage.tsx` | 変更 | FR-006 自動登録フロー追加 |
| `src/pages/TrainingPage.test.tsx` | 変更 | 2テスト追加 |
| `src/components/AddExerciseModal.tsx` | 変更 | FR-006 自動登録フロー追加 |
| `src/components/AddExerciseModal.test.tsx` | 変更 | 2テスト追加 |
| `src/types/index.ts` | 変更 | Route に `'exercise-master'` 追加 |
| `src/App.tsx` | 変更 | ExerciseMasterPage ルート追加 |
| `src/components/BottomNav.tsx` | 変更 | Settings タブ追加 |
| `src/App.test.tsx` | 変更 | 1テスト追加 |
| `e2e/exercise-master.spec.ts` | 新規 | E2Eテスト 7件 |

## 要求カバレッジ

| 要求ID | 要件 | 実装状態 |
|:---|:---|:---|
| FR-005 | テキスト入力で部分一致検索し候補をドロップダウン表示 | 実装済み（既存 search + getAll export） |
| FR-006 | 一致しない文字列を新しい種目として自動登録 | 実装済み（TrainingPage + AddExerciseModal） |
| FR-007 | 設定画面で種目の一覧表示・手動追加・削除 | 実装済み（ExerciseMasterPage） |
| NFR-001 | 種目名は一意であること | 実装済み（create の重複チェック） |
| NFR-002 | 検索結果が体感遅延なく表示 | 実装済み（インメモリフィルター） |

## 備考

- E2Eテストは Playwright ブラウザのインストールが必要（`npx playwright install`）
- Phase 3 AI 機能での Exercise 読み取りは `getAll()` export で対応可能
