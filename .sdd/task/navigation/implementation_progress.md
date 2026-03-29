---
id: "impl-navigation"
title: "ページナビゲーション 実装ログ"
type: "impl"
status: "completed"
depends-on: ["design-navigation"]
tags: ["navigation", "routing", "bottom-nav", "pwa"]
category: "ui"
priority: "high"
created: "2026-03-29"
updated: "2026-03-29"
completed: "2026-03-29"
implementer: "Claude"
---

# ページナビゲーション 実装ログ

## 概要

Zustand ベースのルーティング、BottomNav + FAB、TrainingPage/HistoryPage、workoutStore persist を TDD で実装した。

## 実装フェーズ

### Phase 1: Foundation（完了）

- `src/types/index.ts` に `Route` 型追加
- `src/stores/navigationStore.ts` 新規作成
- `src/hooks/useNavigation.ts` 新規作成
- `src/hooks/useWorkoutSession.ts` に `isActive` 派生状態追加
- `src/stores/workoutStore.ts` に Zustand persist ミドルウェア追加（`partialize`、`onRehydrateStorage`）

### Phase 2: Core（完了）

- `src/components/FAB.tsx` 新規作成
- `src/components/IdleView.tsx` 新規作成
- `src/components/AddExerciseModal.tsx` 新規作成
- `src/components/BottomNav.tsx` 新規作成
- `src/pages/TrainingPage.tsx` 新規作成
- `src/pages/HistoryPage.tsx` 新規作成

### Phase 3: Integration（完了）

- `src/App.tsx` リファクタリング（useState ルーティング → useNavigation）
- `src/pages/WorkoutFormPage.tsx` 削除（TrainingPage に統合）
- `src/pages/WorkoutListPage.tsx` 削除（HistoryPage に置換）
- `src/components/WorkoutCard.tsx` 削除（孤立デッドコード）

### Phase 4: Testing（完了）

各コンポーネント・ストア・フックのユニットテスト: 78 テスト全パス
E2E テスト (Playwright): 24 テスト全パス

### Phase 5: Finishing（完了）

- 全体カバレッジ: 82.61%（D-001 要件 ≥80% を達成）
- `navigation_design.md` の `impl-status` を `"implemented"` に更新

## 主要な技術的決定と解決した問題

### FAB の visibility 戦略

**問題**: Playwright の `toBeHidden()` は `opacity: 0` を "hidden" と判定しない
**解決**: Tailwind の `invisible`（`visibility: hidden`）を使用。レイアウトスペースを保持しつつ Playwright が検出可能

### Playwright E2E: `addInitScript` vs `page.evaluate()`

**問題**: `addInitScript` は `page.reload()` 含む全ページナビゲーションで実行される。セッション永続化テストでリロード後にセッションデータが消去された
**解決**: `page.evaluate()` を `page.goto()` 後に呼び出す。`resetState()` ヘルパー関数で統一

### Playwright E2E: `getByLabel` の部分一致

**問題**: `getByLabel('追加')` が `aria-label="追加"` と `aria-label="種目を追加"`（FAB）の両方にマッチし、FAB をクリックしてしまう
**解決**: `getByRole('button', { name: '追加', exact: true })` で完全一致

### `saveSession` のバグ修正

**問題**: `saveSession()` が `draftDate` をクリアしていなかったため `isActive` が `true` のままになっていた
**解決**: `saveSession()` で `draftDate: '', draftExercises: [], draftMemo: '', draftWorkoutId: null` を明示的にセット

## テスト結果

| 種別 | テスト数 | 結果 |
|-----|---------|------|
| ユニットテスト (Vitest) | 78 | ✅ 全パス |
| E2E テスト (Playwright) | 24 | ✅ 全パス |
| カバレッジ | 82.61% | ✅ ≥80% 達成 |
