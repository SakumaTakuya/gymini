---
id: "impl-settings-review-followup"
title: "設定画面レビュー指摘の残対応 - 実装ログ"
type: "impl-log"
status: "completed"
sdd-phase: "implement"
created: "2026-04-12"
updated: "2026-04-18"
completed: "2026-04-18"
depends-on: ["design-settings", "design-api-key", "design-exercise-master"]
ticket: "settings-review-followup"
tags: ["settings", "ux", "a11y", "tech-debt", "phase-2"]
category: "view"
priority: "medium"
---

# 実装ログ: 設定画面レビュー残タスク

## 実装サマリー

PR #29 で対応した Critical 群に続き、Warning / Info 群 6 件を 10 タスク（4 フェーズ）に分解して実装。

## フェーズ別進捗

| フェーズ | 総タスク数 | 完了 | 完了率 |
|:---|:---|:---|:---|
| Phase 1: UX 改善 | 3 | 3 | 100% |
| Phase 2: データ整合性 | 2 | 2 | 100% |
| Phase 3: 規約整備 | 4 | 4 | 100% |
| Phase 4: テスト | 1 | 1 | 100% |
| **合計** | **10** | **10** | **100%** |

## 実装判断の記録

### 1.1 APIキー debounce

- **判断**: UI 側に 300ms debounce を配置（store の純粋性維持）
- **実装**: `useRef` + `setTimeout`。unmount 時に cleanup
- **補足**: `DEBOUNCE_MS = 300`, `SAVED_HOLD_MS = 1500` を定数化

### 1.2 保存中インジケータ

- **判断**: `SaveStatus` 型（`'idle' | 'saving' | 'saved'`）で状態管理
- **実装**: `min-h-[1em]` で高さ固定し、レイアウトシフト防止
- **補足**: `aria-live="polite"` でスクリーンリーダーにも通知

### 1.3 重複種目名 inline error

- **判断**: `isDuplicateNameError()` で "Duplicate name:" prefix を判定
- **実装**: `DUPLICATE_ERROR_MESSAGE` 定数化。`role="alert"` + `aria-live="polite"` + `aria-invalid` + `aria-describedby`
- **補足**: 将来の toast 基盤導入時に差し替え容易な state ベース設計

### 2.1 外部ストア駆動化

- **判断**: Zustand を選定（`useSyncExternalStore` は同タブ内で storage event が発火しないため）
- **実装**: `useExerciseStore`（Zustand キャッシュ層）+ `useExercises` hook（公開 API）
- **補足**: `UI → Hook → Store → Repository → I/O` の一方向依存を確立

### 3.1 focus-visible 規約

- **判断**: Tailwind v4 の `@utility` でカスタムユーティリティ `focus-ring` を定義
- **実装**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gym-black focus-visible:ring-offset-2 focus-visible:ring-offset-white`
- **補足**: CLAUDE.md と CONSTITUTION.md に規約を追記

### 3.3 全体 focus-visible 適用

- **適用箇所**: APIKeySection / ExerciseRow / ExerciseMasterSection / SettingsPage / IdleView / MonthCalendar / CompletedSetRow / PendingSetRow / ExerciseCard / ExerciseSearchField
- **除外**: BottomNav（TanStack `<Link>`）、EmptyDayState（shadcn `<Button>`）、WorkoutSummary（ボタン無し）

### 4.1 E2E .fixme() 整理

- **判断**: `exercise-master.spec.ts` を削除。重複エラー E2E は `settings.spec.ts` に移設
- **理由**: 重複 3 件削除、未実装機能テスト（AddExerciseModal / 自動登録設定画面反映）3 件削除。主要フローは `workout.spec.ts` がカバー

## テスト結果

| テストスイート | 結果 |
|:---|:---|
| `npm test -- --run` | 247 tests / 32 files PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npx playwright test` | 32 passed / 0 skipped |

## 設計書への反映

| 設計書 | 更新バージョン | 内容 |
|:---|:---|:---|
| `settings/index_design.md` | v1.3 | debounce, save indicator, inline error, hook 層, focus-ring |
| `exercise-master/index_design.md` | v2.1 | Hook 層導入、依存方向図、Zustand 選定理由 |
| CLAUDE.md | - | キーボードフォーカス規約、shadcn Button 採用方針 |
| CONSTITUTION.md | - | T-003 検証項目・準拠例 |

## 参照

- タスク分解: [tasks.md](tasks.md)
- チェックリスト: [checklist.md](checklist.md)
- 検証レポート: [verification_report.md](verification_report.md)
