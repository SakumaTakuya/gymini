---
id: "checklist-settings-review-followup"
title: "設定画面レビュー残タスクの品質チェックリスト"
type: "checklist"
status: "pending"
sdd-phase: "tasks"
created: "2026-04-12"
updated: "2026-04-12"
depends-on: ["task-settings-review-followup"]
ticket: "settings-review-followup"
tags: ["settings", "ux", "a11y", "tech-debt", "phase-2"]
category: "view"
priority: "medium"
---

# 品質チェックリスト: 設定画面レビュー残タスク

## メタ情報

| 項目           | 内容                                                                       |
|:-------------|:-------------------------------------------------------------------------|
| 機能名          | 設定画面レビュー残タスク (settings-review-followup)                                   |
| チケット番号       | settings-review-followup                                                 |
| 対象タスク        | [tasks.md](tasks.md) (10 タスク / 4 フェーズ)                                   |
| 関連設計書        | [settings/index_design.md](../../specification/settings/index_design.md) |
|              | [api-key/index_design.md](../../specification/api-key/index_design.md)   |
|              | [exercise-master/index_design.md](../../specification/exercise-master/index_design.md) |
| 生成日          | 2026-04-12                                                               |
| チェックリストバージョン | 1.0                                                                      |

> **注**: 本タスクは新規 FR を追加せず、既存 FR/NFR を **追加で満たす**（品質向上）ものである。
> 本チェックリストは [tasks.md](tasks.md) の各タスクが設計書・プロジェクト規約に整合する形で完了したかを検証する。

## チェックリストサマリー

| カテゴリ       | 総項目数 | P1 | P2 | P3 |
|:-----------|:-----|:---|:---|:---|
| 要求レビュー     | 4    | 3  | 1  | -  |
| 仕様レビュー     | 3    | 2  | 1  | -  |
| 設計レビュー     | 5    | 3  | 2  | -  |
| 実装レビュー     | 8    | 5  | 3  | -  |
| テストレビュー    | 6    | 4  | 2  | -  |
| ドキュメントレビュー | 4    | 1  | 2  | 1  |
| パフォーマンスレビュー | 2    | 1  | 1  | -  |

**優先度レベル**:

- **P1**: 高 - マージ前に完了すべき
- **P2**: 中 - リリース前に完了すべき
- **P3**: 低 - あると望ましい

---

## 1. 要求レビュー

### CHK-101 [P1] - NFR-001（APIキー非送信）の強化

- [ ] 1.1 debounce 化後も APIキーが localStorage 以外に送信されていない
- [ ] `setApiKey` の呼び出しが外部ネットワークを介していないこと（Grep で fetch/XHR の非存在を確認）
- [ ] 中間入力状態（途中タイプ）が意図せず保存されない

**関連タスク**: 1.1 APIキー onChange 保存を debounce 化
**検証方法**: `/check-spec api-key`、Network パネル監視、debounce 単体テスト

---

### CHK-102 [P1] - FR-009（種目の手動追加・編集・削除）のエラー可視化

- [ ] 1.3 重複種目名の追加/編集で `aria-live="polite"` の inline error が表示される
- [ ] エラー文言「この種目名は既に登録されています」が期待通り表示される
- [ ] キャンセル/再入力でエラーが消える

**関連タスク**: 1.3 重複種目名の inline エラー表示
**検証方法**: ExerciseMasterSection 単体テスト + 手動 VoiceOver 確認

---

### CHK-103 [P1] - NFR-002（種目検索のリアルタイム更新）の一貫性強化

- [ ] 2.1 他タブで種目を追加/削除したとき、現タブの一覧が自動反映される
- [ ] `useSyncExternalStore` もしくは Zustand のいずれを採用したかが設計書に記録されている
- [ ] `useState<Exercise[]>` + `refresh()` の手動更新が撤去されている

**関連タスク**: 2.1 ExerciseMasterSection を外部ストア駆動に
**検証方法**: 統合 or E2E（2 タブ並列操作）、`grep -R "setExercises" src/components/settings/`

---

### CHK-104 [P2] - T-003（44px タップターゲット）の A11y 強化

- [ ] 3.1 で策定された focus-visible 規約が 44px tap target と両立している
- [ ] キーボード操作時にフォーカスリングが可視化される
- [ ] 既存の `before:inset-[-Npx]` 擬似要素拡張と衝突しない

**関連タスク**: 3.1-3.3 focus-visible 適用
**検証方法**: 手動キーボードフォーカス確認、既存テスト pass

---

## 2. 仕様レビュー

### CHK-201 [P1] - exercise-master 設計書の更新

- [ ] 2.1 で採用した実装方針 (useSyncExternalStore vs Zustand) が [exercise-master/index_design.md](../../specification/exercise-master/index_design.md) に反映されている
- [ ] 採用理由・代替案評価が記載されている
- [ ] `impl-status` / `updated` 等の front matter が更新されている

**関連タスク**: 2.2 exercise-master 設計書の更新
**検証方法**: `/check-spec exercise-master` が pass

---

### CHK-202 [P1] - api-key 設計書との整合性

- [ ] 1.1 で UI 側 debounce を選択した判断が api-key 設計書と矛盾しない
- [ ] settingsStore の API 契約（純粋性維持）が守られている
- [ ] debounce を store 側に入れない理由が PR 説明または設計書に記録されている

**関連タスク**: 1.1 APIキー onChange 保存を debounce 化
**検証方法**: `/check-spec api-key` が pass

---

### CHK-203 [P2] - settings 設計書の補足

- [ ] 必要なら 1.2 の「保存中…/保存済み」インジケータが settings 設計書に反映されている
- [ ] 1.3 の inline error パターンが settings 設計書に反映されている

**関連タスク**: 1.2 / 1.3
**検証方法**: `/check-spec settings` が pass

---

## 3. 設計レビュー

### CHK-301 [P1] - debounce 実装方針の妥当性

- [ ] debounce を UI 側に入れる設計判断が実装に反映されている（`useRef` + `setTimeout` or `use-debounce`）
- [ ] 300ms が要件として妥当（連続入力途中で書き込まない）
- [ ] unmount 時のタイマークリーンアップが実装されている

**関連タスク**: 1.1
**検証方法**: コードレビュー、単体テストで fake timer による挙動確認

---

### CHK-302 [P1] - 外部ストア方針の選定根拠

- [ ] useSyncExternalStore と Zustand のトレードオフが比較評価されている
- [ ] 同タブ内変更への対応（storage event が同タブで発火しない問題）が解決されている
- [ ] 選定結果が [tasks.md](tasks.md) §実装上の注意事項と整合する

**関連タスク**: 2.1
**検証方法**: 設計書の §設計判断 を確認

---

### CHK-303 [P1] - focus-visible 規約の設計

- [ ] `focus-visible:ring-2 focus-visible:ring-gym-black focus-visible:ring-offset-2` のベース定義が規約化されている
- [ ] Tailwind v4 の `@theme` 拡張を使うか、`src/index.css` にカスタムユーティリティを追加するかの判断根拠が記載されている
- [ ] raw `<button>` と shadcn `<Button>` の両方への適用指針がある

**関連タスク**: 3.1
**検証方法**: 規約文書のレビュー

---

### CHK-304 [P2] - shadcn Button variant 方針

- [ ] `default | destructive | ghost | icon` の使い分けが文書化されている
- [ ] `EmptyDayState` 以外への段階的移行計画が示されている
- [ ] raw `<button>` を残すケースが定義されている（例: `before:inset` で tap 拡張が必要な場合）

**関連タスク**: 3.4
**検証方法**: RFC or 方針書のレビュー

---

### CHK-305 [P2] - エラー表示パターンの将来拡張性

- [ ] 1.3 の inline error 実装が将来の toast 基盤導入時に差し替え可能である
- [ ] エラー文言の i18n 可能性（ハードコード文字列が最小限）

**関連タスク**: 1.3
**検証方法**: コードレビュー

---

## 4. 実装レビュー

### CHK-401 [P1] - debounce 実装の品質

- [ ] APIKeySection の `onChange` が 300ms debounce 済み
- [ ] 連続入力時に `localStorage.setItem` が最後の状態のみで呼ばれる
- [ ] unmount 時に timer がクリアされる

**関連タスク**: 1.1
**検証方法**: 単体テスト（fake timer）、`grep -n "setTimeout" src/components/settings/APIKeySection.tsx`

---

### CHK-402 [P2] - 保存中インジケータ

- [ ] 入力フィールド近傍に「保存中…」/「保存済み」のステータス表示が出る
- [ ] 表示切り替えが debounce タイミングと整合する
- [ ] 不要に点滅しない

**関連タスク**: 1.2
**検証方法**: 単体テスト + 目視

---

### CHK-403 [P1] - 重複名 inline error の実装

- [ ] `exerciseRepository.create/update` が throw した時にエラーが inline 表示される
- [ ] `aria-live="polite"` がエラー要素に設定されている
- [ ] catch 文が silent に握りつぶしていない（エラー状態を state に反映）

**関連タスク**: 1.3
**検証方法**: コードレビュー、ExerciseMasterSection 単体テスト

---

### CHK-404 [P1] - 外部ストア駆動化の実装

- [ ] `useState<Exercise[]>(() => exerciseRepository.getAll())` が撤去されている
- [ ] `refresh()` のような手動更新ヘルパが撤去されている
- [ ] 他タブ変更の反映が動作する（storage event or Zustand subscribe）

**関連タスク**: 2.1
**検証方法**: コードレビュー、2 タブ E2E

---

### CHK-405 [P1] - focus-visible 適用 (settings)

- [ ] APIKeySection / ExerciseRow / ExerciseMasterSection のすべての `<button>` に規約の focus-visible クラスが適用されている
- [ ] キーボードフォーカスで可視リングが表示される
- [ ] 既存のテストが pass

**関連タスク**: 3.2
**検証方法**: `grep -n "focus-visible" src/components/settings/`、手動キーボード操作

---

### CHK-406 [P2] - focus-visible 適用 (プロジェクト全体)

- [ ] BottomNav / MonthCalendar / IdleView / EmptyDayState / WorkoutSummary の raw button に適用されている
- [ ] 機能単位 (navigation / training / history / settings) で PR が分割されている

**関連タスク**: 3.3
**検証方法**: `grep -rn "focus-visible"  src/components/`

---

### CHK-407 [P1] - 不要ハンドラの撤去

- [ ] 1.1 実装後、APIKeySection の空文字分岐や古い即時保存コードが残っていない
- [ ] 2.1 実装後、ExerciseMasterSection の `setState` + `refresh()` パターンが残っていない

**関連タスク**: 1.1 / 2.1
**検証方法**: コードレビュー、Grep

---

### CHK-408 [P2] - 規約違反の非混入

- [ ] 新規コードで raw Tailwind (`zinc-*`, `red-*` 等) が使われていない（`gym-*` トークン使用）
- [ ] 新規 import がすべて `@/` alias 形式
- [ ] Phosphor icon は `size=N` + `weight="bold"` 明示

**関連タスク**: 横断
**検証方法**: `grep -n "from '\.\./\.\./\.\." src/components/`、lint

---

## 5. テストレビュー

### CHK-501 [P1] - debounce の単体テスト

- [ ] fake timer で連続入力→最終値のみ localStorage に書かれることをテスト
- [ ] unmount 時に保留 timer が走らないことをテスト
- [ ] 既存 E2E「APIキーを入力すると onChange で localStorage に保存され「接続済み」になる」が pass

**関連タスク**: 1.1
**検証方法**: `npm test -- --run src/components/settings/APIKeySection.test.tsx`、Playwright

---

### CHK-502 [P1] - 重複名エラーのテスト

- [ ] 重複名追加時にエラー表示される単体テスト
- [ ] `aria-live` 属性がセットされているアクセシビリティテスト（`getByRole('alert')` or `getByText`）
- [ ] キャンセル/再入力でエラー消失するテスト

**関連タスク**: 1.3
**検証方法**: `npm test -- --run src/components/settings/ExerciseMasterSection.test.tsx`

---

### CHK-503 [P1] - 外部ストア同期テスト

- [ ] 他タブでの種目追加が現タブに自動反映される（統合 or E2E テスト）
- [ ] storage event mock もしくは BroadcastChannel で検証

**関連タスク**: 2.1
**検証方法**: `npx playwright test`（2 ページ並行）

---

### CHK-504 [P1] - `.fixme()` の解消

- [ ] `e2e/exercise-master.spec.ts` の 6 件の `test.fixme()` がすべて解消されている
- [ ] 解消方法（有効化 or `settings.spec.ts` への統合/削除）の判断理由がコメントに記録されている
- [ ] `npx playwright test e2e/exercise-master.spec.ts` が pass

**関連タスク**: 4.1
**検証方法**: `grep -n "test.fixme" e2e/` で 0 件

---

### CHK-505 [P2] - 保存中インジケータのテスト

- [ ] ステータス表示のユニットテストが存在する
- [ ] debounce と連動した切り替えが確認できる

**関連タスク**: 1.2
**検証方法**: `npm test -- --run src/components/settings/APIKeySection.test.tsx`

---

### CHK-506 [P2] - 全体リグレッション

- [ ] `npm test -- --run` が全 pass
- [ ] `npm run typecheck` が pass
- [ ] `npm run lint` が pass
- [ ] `npx playwright test` が pass

**関連タスク**: 全体
**検証方法**: `/run-checklist settings-review-followup`

---

## 6. ドキュメントレビュー

### CHK-601 [P1] - focus-visible 規約の文書化

- [ ] `.sdd/CONSTITUTION.md` または `CLAUDE.md` に規約が追記されている
- [ ] サンプルコードが記載されている
- [ ] raw button / shadcn Button それぞれの適用例がある

**関連タスク**: 3.1
**検証方法**: diff レビュー

---

### CHK-602 [P2] - exercise-master 設計書の更新

- [ ] 2.1 実装方針が設計書に反映されている（CHK-201 と重複確認）
- [ ] 図・シーケンスが最新である

**関連タスク**: 2.2
**検証方法**: `/check-spec exercise-master`

---

### CHK-603 [P2] - shadcn Button 方針書

- [ ] PR or RFC 形式で方針書が作成されている
- [ ] variant 使い分け表がある
- [ ] 段階的移行計画が記載されている

**関連タスク**: 3.4
**検証方法**: `.sdd/` 配下 or docs/ 配下に方針書が存在

---

### CHK-604 [P3] - 設計書 front matter の整合性

- [ ] 影響を受けた設計書の `updated` が更新されている
- [ ] `impl-status` が適切（実装完了後は `implemented`）
- [ ] `depends-on` が正しい向き（設計 → 仕様の一方向）

**関連タスク**: 2.2
**検証方法**: front-matter-reviewer agent

---

## 7. パフォーマンスレビュー

### CHK-701 [P1] - debounce による書き込み抑制

- [ ] 連続 10 文字入力時、`localStorage.setItem` 呼び出しが 1 回に収束する
- [ ] UI が入力ブロッキングしない

**関連タスク**: 1.1
**検証方法**: Performance タブまたはモック `setItem` のカウント

---

### CHK-702 [P2] - 外部ストア subscribe のコスト

- [ ] 大量の種目（例: 500 件）でも再レンダリングが過剰に発生しない
- [ ] selector で再レンダリング最小化されている（Zustand 採用時）

**関連タスク**: 2.1
**検証方法**: React DevTools Profiler

---

## 完了基準

### PR 作成前チェックリスト

各タスクの PR 作成前に以下が完了している必要があります:

- [ ] 当該タスクに紐づく P1 項目がすべてチェック済み
- [ ] 当該タスクの単体/E2E テストが pass
- [ ] `/check-spec` で関連設計書の整合性が確認されている

### マージ前チェックリスト

- [ ] 当該タスクの P1 と P2 項目がすべてチェック済み
- [ ] コードレビュー承認済み
- [ ] `npm test -- --run && npm run typecheck && npm run lint && npx playwright test` が全 pass

### 全タスク完了時の最終チェック

- [ ] 10 タスクすべての P1/P2 項目がチェック済み
- [ ] `.sdd/task/settings-review-followup/` が `/task-cleanup settings-review-followup` で整理済み
- [ ] 残っている設計判断が関連 `*_design.md` に統合済み

---

## 検証コマンド

```bash
# 関連する設計書との整合性確認
/check-spec settings
/check-spec api-key
/check-spec exercise-master

# 本チェックリストの自動検証
/run-checklist settings-review-followup

# 優先度 P1 のみ実行
/run-checklist settings-review-followup --priority P1

# カテゴリ指定（例: テストのみ）
/run-checklist settings-review-followup --category testing
```

---

## 参照ドキュメント

- タスク分解: [tasks.md](tasks.md)
- 抽象仕様書（settings）: [index_spec.md](../../specification/settings/index_spec.md)
- 技術設計書（settings）: [index_design.md](../../specification/settings/index_design.md)
- API キー設計: [api-key/index_design.md](../../specification/api-key/index_design.md)
- exercise-master 設計: [exercise-master/index_design.md](../../specification/exercise-master/index_design.md)
- レビュー元 PR: [#27](https://github.com/SakumaTakuya/gymini/pull/27)、対応 PR: [#29](https://github.com/SakumaTakuya/gymini/pull/29)、タスク化 PR: [#30](https://github.com/SakumaTakuya/gymini/pull/30)
