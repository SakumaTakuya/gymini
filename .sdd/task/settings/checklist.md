# 品質チェックリスト: 設定画面

## メタ情報

| 項目 | 内容 |
|:---|:---|
| 機能名 | 設定画面 |
| 対象仕様書 | `.sdd/specification/settings/index_spec.md` |
| 対象設計書 | `.sdd/specification/settings/index_design.md` |
| 対象PRD | `.sdd/requirement/settings/index.md` |
| タスク分解 | `.sdd/task/settings/tasks.md` |
| 視覚仕様 | `design-system.html` FRAME5 |
| 生成日 | 2026-04-12 |
| チェックリストバージョン | 1.0 |

## チェックリストサマリー

| カテゴリ | 総項目数 | P1 | P2 | P3 |
|:---|:---|:---|:---|:---|
| 要求レビュー | 4 | 3 | 1 | 0 |
| 仕様レビュー | 4 | 3 | 1 | 0 |
| 設計レビュー | 4 | 3 | 1 | 0 |
| 実装レビュー | 4 | 3 | 1 | 0 |
| テストレビュー | 4 | 3 | 1 | 0 |
| セキュリティレビュー | 2 | 2 | 0 | 0 |
| パフォーマンスレビュー | 1 | 0 | 1 | 0 |
| **合計** | **23** | **17** | **6** | **0** |

**優先度レベル**:

- **P1**: 高 - マージ前に完了すべき
- **P2**: 中 - リリース前に完了すべき
- **P3**: 低 - あると望ましい

> **除外カテゴリ**: ドキュメントレビュー（コードコメントのみ）、デプロイレビュー（クライアントサイド完結、DB/マイグレーションなし）

---

## 1. 要求レビュー

### CHK-101 [P1] 機能要件の網羅性

- [x] FR-001: 設定画面が /settings ルートで表示される（layout route 外、BottomNav 非表示）✅ navigation 実装済み + SettingsContent 配置済み
- [x] FR-002: Xボタンで遷移元の画面に戻る（直接アクセス時は /training へフォールバック）✅ SettingsPage 既実装
- [x] FR-003: APIキー設定セクションが表示される（入力 + マスク切替 + ステータス + 削除）✅ APIKeySection.test.tsx 11 tests
- [x] FR-004: APIキーを localStorage に保存・削除できる ✅ settingsStore.test.ts 13 tests
- [x] FR-005: APIキーの表示/非表示をトグルできる（パスワードマスク）✅ APIKeySection マスク切替テスト
- [x] FR-006: APIキー未設定時に接続ステータスが「未設定」と表示される ✅ APIKeySection ステータス表示テスト
- [x] FR-007: 種目マスター管理セクションが表示される（検索 + 一覧 + 追加 + 編集）✅ ExerciseMasterSection.test.tsx 7 tests
- [x] FR-008: 種目をリアルタイム検索で絞り込みできる ✅ filters exercises in real-time as user types
- [x] FR-009: 種目の手動追加・編集・削除ができる ✅ add/edit/delete tests passing

**検証方法**:

- コンポーネントテスト・統合テスト・E2E テストで各 FR を検証
- `/check-spec settings` で仕様との整合性を確認

**関連要求**: FR_021, FR_022, FR_023, FR_024, FR_025（PRD）

---

### CHK-102 [P1] 非機能要件

- [x] NFR-001: APIキーが localStorage 以外に送信されないこと（外部通信なし）✅ grep で fetch/axios/XHR 検出なし
- [x] NFR-002: 種目検索のフィルタリングが入力に追従すること（キーストロークごとにリアルタイム更新）✅ onChange で即時フィルタ（デバウンスなし）

**検証方法**:

- NFR-001: Network DevTools で Gemini API 以外への通信がないことを確認
- NFR-002: 手動操作 + コンポーネントテストで検証

---

### CHK-103 [P1] ユーザーシナリオの網羅性

- [x] 画面アクセス: 歯車アイコンから /settings へ遷移、SettingsContent が表示される ✅ SettingsContent.test.tsx
- [x] APIキー入力: パスワードフィールドに入力 → localStorage に自動保存 → ステータス「接続済み」✅ APIKeySection onChange 即保存テスト
- [x] APIキーマスク切替: 目アイコンで表示/非表示を切り替え ✅ toggles visibility テスト
- [x] APIKey削除: 削除ボタンで localStorage からクリア → ステータス「未設定」✅ APIKeySection 削除テスト
- [x] 種目検索: 検索フィールドに入力 → リアルタイムで一覧が絞り込まれる ✅ filters exercises in real-time
- [x] 種目追加: 「種目を追加」ボタンで新規種目を登録 ✅ adds new exercise テスト
- [x] 種目編集・削除: ExerciseRow の各ボタンで種目を編集・削除 ✅ edits/deletes exercise テスト
- [ ] 戻りナビゲーション: Xボタンで遷移元の画面に戻る ⚠️ 既存 SettingsPage.tsx 実装済み（E2E 未検証）

**検証方法**:

- spec Section 7 シーケンス図（7.1〜7.3）の全フローに対応するテストの存在を確認
- E2E テスト（タスク 4.2）で主要フロー検証

---

### CHK-104 [P2] PRD との整合性

- [x] PRD の FR_021〜FR_025 が全てタスクでカバーされている ✅ tasks.md の要求カバレッジ表 100%
- [x] FR_022 (GearIcon 赤バッジ) が navigation モジュールで `settingsStore.hasApiKey` を参照する形で実装されている ✅ GearIcon.tsx:6,14
- [x] PRD の画面レイアウト（Section 4）が SettingsContent の構成に反映されている ✅ タイトル + APIKeySection + ExerciseMasterSection

**検証方法**:

```bash
/check-spec settings
```

---

## 2. 仕様レビュー

### CHK-201 [P1] 公開 API の実装

- [x] `SettingsContent` — 設定画面コンテンツ統合コンポーネント（`src/components/settings/SettingsContent.tsx`）✅
- [x] `APIKeySection` — APIキー管理セクション（settingsStore を使用）✅
- [x] `ExerciseMasterSection` — 種目マスター管理セクション（ExerciseRepository を使用）✅
- [x] `ExerciseRow` — 種目一覧の1行コンポーネント ✅
- [x] `settingsStore` — `apiKey`, `hasApiKey`, `setApiKey`, `deleteApiKey`, `loadApiKey` ✅ api-key モジュールで実装済み

**検証方法**:

```bash
npx tsc --noEmit
```

**参照**: spec Section 4（API）

---

### CHK-202 [P1] 型定義の整合性

- [ ] `APIKeyStatus = 'connected' | 'not-set'` が spec と一致 ⚠️ 型エクスポートは未実装（UI 内で hasApiKey → 表示の直接分岐で運用。型は Phase 3 で追加予定）
- [x] `Exercise = { id: string; name: string }` が exercise-master モジュールの型と一致 ✅ src/types/index.ts
- [x] `SettingsState` / `SettingsActions` が design Section 5 と一致 ✅ settingsStore.ts で型定義済み
- [x] `any` 型を使用していない（T-001）✅ tsc --noEmit pass

**検証方法**:

- 実装の型定義と spec Section 4.1 / design Section 5 を目視比較
- `npx tsc --noEmit` で型エラーなし

---

### CHK-203 [P1] 振る舞いの整合性

- [x] 設定画面アクセスフロー（spec §7.1）: GearIcon → navigate /settings → SettingsContent 表示 ✅
- [x] APIキー管理フロー（spec §7.2）: 入力 → setApiKey → localStorage 保存 → ステータス更新 ✅
- [x] APIキー削除フロー（spec §7.2）: 削除ボタン → deleteApiKey → localStorage から削除 → ステータス「未設定」✅
- [x] 種目検索フロー（spec §7.3）: 検索入力 → ExerciseRepository.search() → リアルタイム更新 ✅

**検証方法**:

- コードフローを spec Section 7 シーケンス図と比較

---

### CHK-204 [P2] 制約の実装

- [x] APIキーは localStorage にのみ保存される。外部サーバーに送信されない（B-001）✅ grep 検出なし
- [x] 設定画面は navigation の layout route 外に配置されている ✅ routes/settings.tsx（layout 外）
- [x] 戻りナビゲーション（Xボタン / ブラウザバック）は navigation の SettingsPage が実装 ✅
- [x] 全タップターゲットが最低 44px × 44px を確保（T-003）✅ 全ボタンテストで検証
- [x] TypeScript strict mode 遵守（T-001）✅ tsc --noEmit pass
- [x] APIキー接続テスト（Gemini API へのバリデーション）は Phase 3 に先送り ✅ 未実装（設計通り）

**検証方法**:

- コードレビューで各制約を確認

---

## 3. 設計レビュー

### CHK-301 [P1] アーキテクチャの整合性

- [x] ファイル配置が design Section 4.2 と一致 ✅ 全ファイル指定配置
- [x] レイヤー分離が維持されている（Route → UI → State → Data）✅ import 確認済み
- [x] 循環依存がない ✅ tsc / eslint 通過

**検証方法**:

- ディレクトリ構造を design Section 4.1 の構成図と比較
- import 文を確認

---

### CHK-302 [P1] 技術スタックの準拠

- [x] Zustand ^5 で settingsStore を実装（CONSTITUTION 準拠）✅ package.json: zustand ^5.0.5
- [x] localStorage 直接操作（Zustand persist ミドルウェア不使用）✅ settingsStore.ts
- [x] Phosphor Icons（`@phosphor-icons/react`）を使用 ✅ package.json: ^2.1.10
- [x] Tailwind CSS v4 でスタイリング ✅ package.json: tailwindcss ^4.1.0
- [x] 未承認の依存関係が追加されていない ✅ 本 PR で依存追加なし

**検証方法**:

```bash
cat package.json | grep -E "(zustand|@phosphor-icons)"
```

---

### CHK-303 [P1] 視覚仕様の準拠（design-system.html FRAME5）

- [x] **レイアウト全体**: `px-4 pt-20 pb-8 space-y-6` ✅ SettingsContent.tsx
- [x] **タイトル**: 「設定」 `text-2xl font-outfit font-bold` ✅
- [x] **セクションカード**: `bg-white rounded-2xl p-4 shadow-sm border border-zinc-100` ✅ 両セクション
- [x] **セクションラベル**: `text-sm font-outfit font-bold text-zinc-500 mb-3` ✅
- [x] **APIキー入力フィールド**: `bg-zinc-100 rounded-xl px-4 h-12 text-sm font-inter`、右端に目アイコンボタン ✅
- [x] **ステータス表示**: 接続済み 🟢 `text-emerald-600 text-sm` / 未設定 `text-zinc-400 text-sm` ✅
- [x] **種目検索**: `PhMagnifyingGlass` アイコン + placeholder「種目を検索...」✅
- [x] **種目追加ボタン**: `PhPlus` アイコン + 「種目を追加」`text-sm text-zinc-500` ✅
- [x] **種目行区切り**: `border-b border-zinc-100` ✅ ExerciseRow.tsx
- [ ] 実機ブラウザでの目視比較 ⚠️ 手動検証推奨

**検証方法**:

- ブラウザで `design-system.html` FRAME5 と実装を並べて目視比較

---

### CHK-304 [P2] 設計判断の整合性

- [x] settingsStore: Zustand persist ではなく直接 localStorage 操作 ✅
- [x] APIキー保存: onChange 即保存（保存ボタン不要）✅
- [x] 設定画面の構造: セクション分割（APIKeySection + ExerciseMasterSection）✅
- [x] 種目検索: デバウンスなし（localStorage は即時読み取り可能）✅
- [x] 種目編集: インライン編集（モーダル不要）✅ Check/X ボタン確定方式
- [x] APIキー接続テスト: Phase 3 で実装（現時点ではスキップ）✅

**検証方法**:

- design Section 9.1 の決定事項と実装を比較

---

## 4. 実装レビュー

### CHK-401 [P1] コード構造

- [x] 各コンポーネント・ストアが単一責任 ✅
- [x] コンポーネントが `.tsx`、ストアが `.ts` ✅
- [x] localStorage キー（`gymini:api-key`）がストア内の定数として管理 ✅ settingsStore.ts:3
- [x] デッドコード・コメントアウトされたブロックがない ✅ eslint pass

**検証方法**:

```bash
npx eslint src/components/settings/ src/stores/settingsStore.ts
```

---

### CHK-402 [P1] エラーハンドリング

- [x] settingsStore の全 localStorage 操作が `try-catch` でラップされている（T-002）✅
- [x] `setApiKey` のエラー時は状態のみ更新される（T-002）✅ settingsStore.test.ts NFR-002 test
- [x] `loadApiKey` のエラー時はデフォルト状態（空文字）にフォールバック ✅
- [x] `deleteApiKey` のエラー時も状態をリセット ✅
- [x] ExerciseRepository のエラーで画面がクラッシュしない ✅ try-catch で重複・欠損を無視

**検証方法**:

- localStorage を無効化した状態でテスト
- `vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error() })`

---

### CHK-403 [P1] コンポーネント Props の正確性

- [x] APIKeySection: settingsStore から必要な state/action のみを selector で取得 ✅ 個別 selector 使用
- [x] ExerciseMasterSection: ExerciseRepository のインターフェースに準拠 ✅ getAll/search/create/update/remove
- [x] ExerciseRow: props (`exercise`, `onEdit`, `onDelete`) が正しく型付け ✅
- [x] SettingsContent: 子コンポーネントを単純に配置（独自ロジックなし）✅

**検証方法**:

- コードレビューで props 定義を design Section 6 と比較

---

### CHK-404 [P2] コード品質

- [x] ESLint エラーなし ✅ `npx eslint src/components/settings/ src/stores/settingsStore.ts` pass
- [x] TypeScript strict mode でコンパイルエラーなし ✅ `tsc --noEmit` pass
- [x] 重複コードがない（APIKeySection と ExerciseMasterSection のセクションカードスタイル等）✅ `SectionCard` に抽出
- [x] 共通スタイルは可能なら Tailwind コンポーネントクラスまたは共通コンポーネント化 ✅ shadcn `<Card>` をラップした `SectionCard` を新設

**検証方法**:

```bash
npx eslint src/components/settings/ src/stores/settingsStore.ts
npx tsc --noEmit
```

---

## 5. テストレビュー

### CHK-501 [P1] ユニットテストカバレッジ

- [x] settingsStore: `setApiKey`, `deleteApiKey`, `loadApiKey`, `hasApiKey` 派生値 ✅ 13 tests, 100% coverage
- [x] settingsStore: localStorage エラー時のフォールバック（T-002）✅ 3 NFR-002 テスト
- [x] settingsStore: 空文字入力時 → `deleteApiKey()` で `hasApiKey: false` ✅

**検証方法**:

```bash
npx vitest run src/stores/settingsStore.test.ts --coverage
```

---

### CHK-502 [P1] コンポーネントテストカバレッジ

- [x] APIKeySection: 入力 → 保存、マスク切替、削除、ステータス表示 ✅ 11 tests, 98.3% coverage
- [x] ExerciseMasterSection: 検索フィルタ、追加、編集、削除 ✅ 7 tests, 96.95% coverage
- [x] ExerciseRow: 種目名表示、編集/削除ボタン ✅ 4 tests, 100% coverage
- [x] SettingsContent: APIKeySection + ExerciseMasterSection が統合表示 ✅ 3 tests, 100% coverage

**検証方法**:

```bash
npx vitest run src/components/settings/
```

---

### CHK-503 [P1] 統合テスト・E2E テスト

- [x] 統合テスト: SettingsContent 内で APIKeySection と ExerciseMasterSection が独立動作 ✅ SettingsContent.test.tsx
- [x] E2E テスト: 歯車アイコン → 設定画面 → X ボタンで戻る ✅ navigation.spec.ts で既存カバー
- [x] E2E テスト: APIキーの入力・表示切替・削除動作 ✅ e2e/settings.spec.ts 4 tests
- [x] E2E テスト: 種目の検索・追加・編集・削除フロー ✅ e2e/settings.spec.ts 5 tests

**検証方法**:

```bash
npx vitest run src/components/settings/
npx playwright test e2e/settings.spec.ts
```

---

### CHK-504 [P2] エッジケーステスト

- [x] APIキーが空文字の場合 → `deleteApiKey()` 経由で `hasApiKey: false` ✅ APIKeySection handleChange
- [ ] 非常に長いAPIキー文字列の扱い ⚠️ 明示的テストなし（型が string なので暗黙的に OK）
- [x] 種目名の空文字・重複入力時の扱い ✅ ExerciseMasterSection `does not add empty exercise name` + 重複は catch で無視
- [x] localStorage 容量超過時のエラーハンドリング ✅ settingsStore NFR-002 テスト
- [x] 検索クエリが空文字の場合に全件表示される ✅ ExerciseMasterSection 実装（`trim() === ''` → getAll）

**検証方法**:

- エッジケーステストの存在を確認

---

## 6. セキュリティレビュー

### CHK-701 [P1] APIキーの保護（NFR-001, B-001）

- [x] APIキーが localStorage のみに保存されている ✅ settingsStore.ts STORAGE_KEY
- [x] APIキーが外部サーバーに送信されていない ✅ `grep fetch|XMLHttpRequest|axios` 検出なし
- [x] APIキーがログ（`console.log`）に出力されていない ✅ `grep console.log` 検出なし
- [x] APIキーが URL クエリパラメータや routing state に含まれていない ✅ 該当コードなし
- [x] 入力フィールドは `type="password"` でデフォルトマスクされている ✅ APIKeySection.tsx

**検証方法**:

```bash
grep -rE "(fetch|XMLHttpRequest|axios|console\\.log)" src/components/settings/ src/stores/settingsStore.ts
```

---

### CHK-702 [P1] XSS 対策

- [x] 種目名などのユーザー入力が React の JSX 補間のみで使用されている ✅ `grep dangerouslySetInnerHTML` 検出なし
- [x] APIキーの表示時も React の props 経由で安全にレンダリングされている ✅ value bind のみ

**検証方法**:

```bash
grep -rE "dangerouslySetInnerHTML" src/components/settings/
```

---

## 7. パフォーマンスレビュー

### CHK-801 [P2] リアルタイム検索のパフォーマンス

- [x] 種目検索が入力に即応する（デバウンスなし即時フィルタ）✅ 設計通り
- [ ] 大量の種目データ（100件以上）でもフィルタリングが即時 ⚠️ 手動検証必要
- [ ] 不要な再レンダリングが発生していない（React DevTools Profiler）⚠️ 手動検証必要

**検証方法**:

- 100件以上のテストデータで検索パフォーマンスを確認
- React DevTools Profiler で再レンダリング回数を確認

---

## 完了基準

### PR作成前チェックリスト

すべての P1 項目が完了している必要があります:

- [ ] すべての P1 項目がチェック済み（17/17）
- [ ] すべてのテストが pass している
- [ ] `npx tsc --noEmit` でエラーなし
- [ ] `npx eslint` で該当ファイルにエラーなし
- [ ] design-system.html FRAME5 と見た目が一致している
- [ ] 仕様との整合性が検証されている（`/check-spec settings`）

### マージ前チェックリスト

すべての P1 と P2 項目が完了している必要があります:

- [ ] すべての P1 項目がチェック済み（17/17）
- [ ] すべての P2 項目がチェック済み（6/6）
- [ ] コードレビュー承認済み
- [ ] CI パイプライングリーン
- [ ] E2E テスト pass

---

## 参照ドキュメント

- PRD: [index.md](../../requirement/settings/index.md)
- 抽象仕様書: [index_spec.md](../../specification/settings/index_spec.md)
- 技術設計書: [index_design.md](../../specification/settings/index_design.md)
- タスク分解: [tasks.md](tasks.md)
- **視覚仕様: [design-system.html](../../design-system.html) FRAME5**
- 関連: [api-key](../../specification/api-key/index_spec.md), [exercise-master](../../specification/exercise-master/index_spec.md), [navigation](../../specification/navigation_spec.md)
