# 品質チェックリスト: 履歴画面

## メタ情報

| 項目 | 内容 |
|:---|:---|
| 機能名 | 履歴画面 |
| 対象仕様書 | `.sdd/specification/history/index_spec.md` |
| 対象設計書 | `.sdd/specification/history/index_design.md` |
| 対象PRD | `.sdd/requirement/history/index.md` |
| タスク分解 | `.sdd/task/history/tasks.md` |
| 視覚仕様 | `design-system.html` FRAME 3: History Tab |
| 生成日 | 2026-04-11 |
| チェックリストバージョン | 1.0 |

## チェックリストサマリー

| カテゴリ | 総項目数 | P1 | P2 | P3 |
|:---|:---|:---|:---|:---|
| 要求レビュー | 4 | 3 | 1 | 0 |
| 仕様レビュー | 5 | 4 | 1 | 0 |
| 設計レビュー | 4 | 3 | 1 | 0 |
| 実装レビュー | 4 | 3 | 1 | 0 |
| テストレビュー | 4 | 3 | 1 | 0 |
| セキュリティレビュー | 1 | 1 | 0 | 0 |
| パフォーマンスレビュー | 2 | 1 | 1 | 0 |
| **合計** | **24** | **18** | **6** | **0** |

**優先度レベル**:

- **P1**: 高 - マージ前に完了すべき
- **P2**: 中 - リリース前に完了すべき
- **P3**: 低 - あると望ましい

> **除外カテゴリ**: デプロイレビュー（クライアントサイド完結、DB/マイグレーションなし）

---

## 1. 要求レビュー

### CHK-101 [P1] 機能要件の網羅性

- [ ] FR-001: 月表示カレンダーグリッド（7列: 日〜土）が表示される
- [ ] FR-002: 左右シェブロンボタンで前月・次月に遷移できる
- [ ] FR-003: ワークアウト記録がある日に赤ドットマーカーが表示される
- [ ] FR-004: 記録がある日のテキストが強調され、記録がない日は控えめに表示される
- [ ] FR-005: 日付タップでリングハイライトの選択状態になり、カレンダー下部にサマリーが表示される
- [ ] FR-006: サマリーが種目名 + セット一覧（重量 x 回数）を表示し、複数ワークアウトがセクション分割される
- [ ] FR-007: 記録がない日を選択した場合、空状態UI（「記録なし」+ 追加ボタン）が表示される
- [ ] FR-008: 空状態の「追加」ボタンタップで FRAME2 へ遷移し、選択日付でセッション開始する
- [ ] FR-009: 今日の日付セルが黒塗り背景 + 白テキストで強調表示される
- [ ] FR-010: 今日にトレーニング記録がある場合、強調表示と赤ドットが併せて表示される
- [ ] FR-011: 未来の日付もタップ可能で、空状態UIが表示される

**検証方法**:

- ユニットテスト・コンポーネントテスト・統合テストで各 FR を検証
- `/check-spec history` で仕様との整合性を確認

**関連要求**: FR_013, FR_014, FR_015, FR_026, FR_027（PRD）

---

### CHK-102 [P1] 非機能要件

- [ ] NFR-001: カレンダーの月遷移がユーザーに待機感を与えない（瞬時）
- [ ] NFR-002: 日付タップからサマリー表示まで 100ms 以内
- [ ] NFR-003: 日付セルのタップ領域が 44px x 44px 相当（視覚サイズ 36px + グリッドセル領域で確保）

**検証方法**:

- NFR-001/002: ブラウザで手動操作し体感確認 + Performance DevTools
- NFR-003: design-system.html FRAME 3 と CSS 比較（`w-9 h-9` = 36px、グリッド gap で 44px 相当）

---

### CHK-103 [P1] ユーザーシナリオの網羅性

- [ ] 画面表示時: 今月カレンダーが表示され、記録がある日にマーカーが付く
- [ ] 日付選択（記録あり）: サマリーが種目・セット単位で表示される
- [ ] 日付選択（記録なし）: 空状態UIが表示される
- [ ] 空状態からの追加: 「追加」ボタンで FRAME2 に遷移しワークアウト開始
- [ ] 月遷移: シェブロンで前月/次月に移動、マーカーが更新される
- [ ] タブ復帰時: 表示月と選択日が保持される（search params）

**検証方法**:

- spec Section 7 シーケンス図の全フローに対応するテストケースの存在を確認
- 統合テスト（タスク 4.7）で主要フロー検証

---

### CHK-104 [P2] PRD との整合性

- [ ] PRD の FR_013〜FR_015, FR_026, FR_027 が全てタスクでカバーされている
- [ ] PRD のカレンダー日付セル状態一覧（Section 4）が MonthCalendar の実装に反映されている
- [ ] PRD の画面レイアウト（Section 5）が HistoryPage の構成に反映されている

**検証方法**:

```bash
/check-spec history
```

---

## 2. 仕様レビュー

### CHK-201 [P1] 公開 API の実装

- [ ] `HistoryPage` — 履歴画面ルートコンポーネント（`src/routes/history.tsx`）
- [ ] `MonthCalendar` — MonthCalendarProps に準拠（displayMonth, selectedDate, daysWithWorkouts, onPrevMonth, onNextMonth, onSelectDate）
- [ ] `WorkoutSummary` — WorkoutSummaryProps に準拠（date, workouts）
- [ ] `EmptyDayState` — EmptyDayStateProps に準拠（date, onAddWorkout）
- [ ] `useCalendar` — UseCalendarReturn に準拠（selectedDate, displayMonth, goToPrevMonth, goToNextMonth, selectDate, daysWithWorkouts）
- [ ] `useWorkoutsForDate` — `(date: DateString | null) => WorkoutRecord[]`
- [ ] `DateString` — Zod branded type（`src/schemas/date.ts`）

**検証方法**:

```bash
npx tsc --noEmit
```

**参照**: spec Section 4（API）

---

### CHK-202 [P1] 型定義の整合性

- [ ] `DateString` = `string & { readonly __brand: 'DateString' }`（spec Section 4.1）
- [ ] `UseCalendar` の戻り値型が spec と一致（displayMonth: `{ year: number; month: number }`）
- [ ] `DayCellState` 型の5状態が MonthCalendar で正しく派生計算される
- [ ] `WorkoutSummaryData` 型は独立定義しない（WorkoutRecord[] を直接使用、design Section 6 判断）
- [ ] `any` 型を使用していない（T-001）

**検証方法**:

- 実装の型定義と spec Section 4.1 を目視比較
- `npx tsc --noEmit` で型エラーなし

---

### CHK-203 [P1] 振る舞いの整合性

- [ ] 画面表示時: useCalendar が今月のワークアウト日集合を TanStack Query で取得（spec Section 7）
- [ ] 日付選択（記録あり）: selectDate → useWorkoutsForDate → WorkoutSummary 表示
- [ ] 日付選択（記録なし）: selectDate → useWorkoutsForDate が空 → EmptyDayState 表示
- [ ] 月遷移: goToPrevMonth/goToNextMonth → search params 更新 → selectedDate リセット → daysWithWorkouts 再取得
- [ ] 空状態「追加」: onAddWorkout → navigate to `/` with `startDate`

**検証方法**:

- コードフローを spec Section 7 シーケンス図と比較

---

### CHK-204 [P1] 制約の実装

- [ ] データ取得は `workoutRepository` 経由でlocalStorageから。サーバー通信なし（A-002, B-001）
- [ ] カレンダーUIは shadcn/ui Calendar（react-day-picker ベース）を使用（A-001）
- [ ] 履歴画面は閲覧専用。既存記録の編集・削除機能を含まない
- [ ] 削除済み種目は `exerciseName` をそのまま表示（特別な表示なし）
- [ ] タブ復帰時にカレンダーの表示月と選択日が保持される（search params）
- [ ] daysWithWorkouts は画面表示のたびに再取得（staleTime: 0）

**検証方法**:

- コードレビューで各制約を確認

---

### CHK-205 [P2] search params スキーマの整合性

- [ ] `historySearchSchema` が `month` (optional, "YYYY-MM") と `date` (optional, DateString) を定義
- [ ] `validateSearch` に Zod スキーマが渡されている
- [ ] 不正な search params でアプリがクラッシュしない

**検証方法**:

- `/history?month=invalid&date=bad` でアクセスしエラーハンドリングを確認

---

## 3. 設計レビュー

### CHK-301 [P1] アーキテクチャの整合性

- [ ] ファイル配置が design Section 4.2 と一致:
  - `src/schemas/date.ts`
  - `src/hooks/useCalendar.ts`
  - `src/hooks/useWorkoutsForDate.ts`
  - `src/components/MonthCalendar.tsx`
  - `src/components/WorkoutSummary.tsx`
  - `src/components/EmptyDayState.tsx`
  - `src/routes/history.tsx`
- [ ] レイヤー分離が維持されている（Route → Hooks → Cache → Data）
- [ ] 循環依存がない

**検証方法**:

- ディレクトリ構造を design Section 4.1 の構成図と比較
- import 文を確認

---

### CHK-302 [P1] 技術スタックの準拠

- [ ] shadcn/ui Calendar（react-day-picker）を使用（A-001）
- [ ] TanStack Router のファイルベースルーティング
- [ ] TanStack Query でデータフェッチ/キャッシュ
- [ ] Tailwind CSS でスタイリング
- [ ] Zustand を履歴画面で使用していない（search params で状態管理）
- [ ] 未承認の依存関係が追加されていない

**検証方法**:

```bash
cat package.json | grep -E "(react-day-picker|@tanstack)"
```

---

### CHK-303 [P1] 視覚仕様の準拠（design-system.html FRAME 3）

- [ ] **カレンダーモジュール**: コンテナ `rounded-[32px] p-5 shadow-soft`、月ヘッダー font-outfit font-bold、曜日行の日曜 accent 色
- [ ] **日付セル 5状態**: 記録なし（`text-gym-zinc-400`）、記録あり（`text-gym-black` + 赤ドット）、選択中（`ring-2 ring-gym-black`）、今日（`bg-gym-black text-white`）、前月/次月（`text-gym-zinc-200` タップ不可）
- [ ] **サマリーコンテナ**: `rounded-[24px] p-5 shadow-soft`、種目名 font-outfit font-bold、セット行レイアウト（SET/重量kg x 回数回）
- [ ] **空状態**: 破線ボーダー `border-2 border-dashed`、ゴーストアイコン `ph-duotone ph-ghost`、追加ボタン `ph-bold ph-plus`

**検証方法**:

- ブラウザで `design-system.html` FRAME 3 と実装を並べて目視比較
- Playwright スクリーンショットによるビジュアルリグレッション（任意）

---

### CHK-304 [P2] 設計判断の整合性

- [ ] カレンダーUI: 自作ではなく shadcn/ui Calendar を使用（calendarUtils / DayCell は不要）
- [ ] 状態管理: TanStack Router search params（Zustand 不使用）
- [ ] ワークアウト日取得: 全件取得 + メモリフィルタ（月ごとインデックス不要）
- [ ] 日付型: Zod branded type（素の string / Date 不使用）
- [ ] 非当月日: 薄色表示（タップ不可）、非表示ではない

**検証方法**:

- design Section 9.1 の決定事項と実装を比較

---

## 4. 実装レビュー

### CHK-401 [P1] コード構造

- [ ] 各コンポーネント・フックが単一責任（MonthCalendar = カレンダーUI、WorkoutSummary = サマリー表示、EmptyDayState = 空状態）
- [ ] コンポーネントが `.tsx`、フック・スキーマが `.ts`（design Section 3）
- [ ] `STORAGE_KEY` 等のマジックストリングがない
- [ ] TanStack Query キーが `queryKeys` ファクトリで一元管理されている（`src/lib/queryKeys.ts`）
- [ ] デッドコード・コメントアウトされたブロックがない

**検証方法**:

```bash
npx eslint src/routes/history.tsx src/hooks/useCalendar.ts src/hooks/useWorkoutsForDate.ts src/components/MonthCalendar.tsx src/components/WorkoutSummary.tsx src/components/EmptyDayState.tsx src/schemas/date.ts
```

---

### CHK-402 [P1] エラーハンドリング

- [ ] TanStack Query の onError で console.error ログ出力（design Section 7: T-002）
- [ ] エラー時に空の Set / 空配列にフォールバック
- [ ] `toDateString()` の ZodError が適切にハンドリングされる（search params の validateSearch 経由）
- [ ] workoutRepository のエラーでアプリがクラッシュしない

**検証方法**:

- localStorage を無効化した状態でテスト
- 不正な search params でアクセス

---

### CHK-403 [P1] コンポーネント Props の正確性

- [ ] MonthCalendar: `components` prop でカスタム day レンダリング、`modifiers` で hasWorkout 日を指定
- [ ] WorkoutSummary: `WorkoutRecord[]` を直接 props で受け取り（独立した WorkoutSummaryData 型は不使用）
- [ ] EmptyDayState: `onAddWorkout(date)` で navigate + startSession を呼び出す
- [ ] HistoryPage: useCalendar + useWorkoutsForDate を組み合わせた条件レンダリング

**検証方法**:

- コードレビューで props 定義を design Section 6 と比較

---

### CHK-404 [P2] コード品質

- [ ] ESLint エラーなし
- [ ] TypeScript strict mode でコンパイルエラーなし
- [ ] 重複コードがない（カレンダーセル状態の計算ロジック等）
- [ ] react-day-picker の `DayProps` 型を正しく継承している

**検証方法**:

```bash
npx eslint src/routes/history.tsx src/hooks/ src/components/ src/schemas/date.ts
npx tsc --noEmit
```

---

## 5. テストレビュー

### CHK-501 [P1] ユニットテストカバレッジ

- [ ] DateString（タスク 4.1）: 有効形式の受理、無効形式の拒否、todayDateString の形式
- [ ] useCalendar（タスク 4.2）: デフォルト今月、月遷移、selectedDate リセット、selectDate、daysWithWorkouts 取得
- [ ] useWorkoutsForDate（タスク 4.3）: null で空配列、記録あり日、記録なし日

**検証方法**:

```bash
npx vitest run src/schemas/date.test.ts src/hooks/useCalendar.test.ts src/hooks/useWorkoutsForDate.test.ts --coverage
```

---

### CHK-502 [P1] コンポーネントテストカバレッジ

- [ ] MonthCalendar（タスク 4.4）: 7列グリッド表示（FR-001）、月遷移（FR-002）、赤ドット（FR-003）、テキスト強調（FR-004）、今日強調（FR-009）、今日+赤ドット（FR-010）
- [ ] WorkoutSummary（タスク 4.5）: 種目・セット表示（FR-005）、複数ワークアウトのセクション分割（FR-006）
- [ ] EmptyDayState（タスク 4.6）: 「記録なし」テキスト（FR-007）、追加ボタンのコールバック（FR-008）

**検証方法**:

```bash
npx vitest run src/components/MonthCalendar.test.tsx src/components/WorkoutSummary.test.tsx src/components/EmptyDayState.test.tsx
```

---

### CHK-503 [P1] 統合テスト・E2E テスト

- [ ] history ルート統合テスト（タスク 4.7）: カレンダー + サマリー連携、search params 状態保持、未来日付（FR-011）
- [ ] E2E テスト（タスク 5.2）: 月遷移 → 日付選択 → サマリー表示 → 空状態 → 追加ボタン遷移

**検証方法**:

```bash
npx vitest run src/routes/history.test.tsx
npx playwright test e2e/history.spec.ts
```

---

### CHK-504 [P2] エッジケーステスト

- [ ] 同日複数ワークアウトのセクション分割表示
- [ ] 記録が0件の月でカレンダーが正常表示される
- [ ] 12月→1月の年跨ぎ月遷移
- [ ] 1月→12月の年跨ぎ逆遷移
- [ ] search params が空の場合のデフォルト動作（今月、未選択）
- [ ] workoutRepository 未実装時のモックでのフック動作

**検証方法**:

- エッジケーステストケースの存在を確認

---

## 6. セキュリティレビュー

### CHK-701 [P1] クライアントサイド完結性（A-002, B-001）

- [ ] データ取得が `workoutRepository`（localStorage）経由のみ。外部サーバーへの通信パスがない
- [ ] search params に機密情報（APIキー等）が含まれない
- [ ] `fetch` / `XMLHttpRequest` 等のネットワーク呼び出しが履歴画面モジュール内にない

**検証方法**:

```bash
grep -rE "(fetch|XMLHttpRequest|axios|http)" src/routes/history.tsx src/hooks/useCalendar.ts src/hooks/useWorkoutsForDate.ts src/components/MonthCalendar.tsx src/components/WorkoutSummary.tsx src/components/EmptyDayState.tsx
```

---

## 7. パフォーマンスレビュー

### CHK-801 [P1] 月遷移・日付選択の即時性

- [ ] 月遷移が search params 更新 → 同期レンダリングで瞬時に完了する（NFR-001）
- [ ] 2回目以降の月遷移で TanStack Query キャッシュが効き即座に表示される
- [ ] 日付タップからサマリー表示まで 100ms 以内（NFR-002）

**検証方法**:

- Chrome DevTools Performance パネルで月遷移・日付タップのフレーム時間を計測
- TanStack Query DevTools でキャッシュ HIT を確認

---

### CHK-802 [P2] データ取得効率

- [ ] `workoutRepository.listByDateDesc()` の全件取得がアプリ規模（数百件）で問題ないことを確認
- [ ] `daysWithWorkouts` の staleTime: 0 による再取得がユーザー体験に影響しないことを確認
- [ ] 不要な再レンダリングが発生していない（React DevTools Profiler）

**検証方法**:

- 100件以上のテストデータで月遷移のパフォーマンスを確認
- React DevTools Profiler で再レンダリング回数を確認

---

## 完了基準

### PR作成前チェックリスト

すべての P1 項目が完了している必要があります:

- [ ] すべての P1 項目がチェック済み（18/18）
- [ ] すべてのテストが pass している
- [ ] `npx tsc --noEmit` でエラーなし
- [ ] `npx eslint` で該当ファイルにエラーなし
- [ ] design-system.html FRAME 3 と見た目が一致している
- [ ] 仕様との整合性が検証されている（`/check-spec history`）

### マージ前チェックリスト

すべての P1 と P2 項目が完了している必要があります:

- [ ] すべての P1 項目がチェック済み（18/18）
- [ ] すべての P2 項目がチェック済み（6/6）
- [ ] コードレビュー承認済み
- [ ] CI パイプライングリーン
- [ ] E2E テスト pass

---

## 参照ドキュメント

- PRD: [index.md](../../requirement/history/index.md)
- 抽象仕様書: [index_spec.md](../../specification/history/index_spec.md)
- 技術設計書: [index_design.md](../../specification/history/index_design.md)
- タスク分解: [tasks.md](tasks.md)
- **視覚仕様: [design-system.html](../../design-system.html) FRAME 3: History Tab**
