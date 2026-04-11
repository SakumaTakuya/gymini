# 品質チェックリスト: 種目マスター管理

## メタ情報

| 項目 | 内容 |
|:---|:---|
| 機能名 | 種目マスター管理（ExerciseRepository） |
| 対象仕様書 | `.sdd/specification/exercise-master/index_spec.md` |
| 対象設計書 | `.sdd/specification/exercise-master/index_design.md` |
| PRD | `.sdd/requirement/exercise-master/index.md` |
| 生成日 | 2026-04-11 |
| チェックリストバージョン | 1.0 |

## チェックリストサマリー

| カテゴリ | 総項目数 | P1 | P2 | P3 |
|:---|:---|:---|:---|:---|
| 要求レビュー | 3 | 2 | 1 | 0 |
| 仕様レビュー | 4 | 3 | 1 | 0 |
| 設計レビュー | 3 | 2 | 1 | 0 |
| 実装レビュー | 3 | 2 | 1 | 0 |
| テストレビュー | 3 | 3 | 0 | 0 |
| ドキュメントレビュー | 2 | 0 | 2 | 0 |
| セキュリティレビュー | 2 | 2 | 0 | 0 |
| パフォーマンスレビュー | 1 | 0 | 1 | 0 |
| **合計** | **21** | **14** | **7** | **0** |

**優先度レベル**:

- **P1**: 高 - マージ前に完了すべき
- **P2**: 中 - リリース前に完了すべき
- **P3**: 低 - あると望ましい

---

## 1. 要求レビュー

### CHK-101 [P1] 機能要件の網羅性

- [ ] FR-005: `search(query)` が部分一致検索（前方一致・中間一致）を実装している
- [ ] FR-006: `create(name)` が新規種目の登録を実装している（自動登録フローの Data Layer 部分）
- [ ] FR-007: `getAll()`, `create()`, `update()`, `remove()` が設定画面 CRUD の Data Layer を提供している

**検証方法**:
- PRD の FR_005/FR_006/FR_007 と実装を照合
- `/check-spec exercise-master` で整合性を検証

**関連要求**: FR_005, FR_006, FR_007

---

### CHK-102 [P1] 非機能要件

- [ ] NFR-001: `create()` / `update()` で種目名の一意性チェック（case-sensitive）が実装されている
- [ ] NFR-002: `search()` が数百件規模で 100ms 以内に応答する（インメモリ `Array.filter` 実装）

**検証方法**:
- 重複名でのエラースロー確認テスト
- `search()` のパフォーマンステスト（数百件データ）

**関連要求**: NFR-001, NFR-002

---

### CHK-103 [P2] ユースケースシナリオの検証

- [ ] シナリオ1（検索・自動登録フロー）: `search()` → 候補なし → `create()` → Exercise 返却の流れが動作する
- [ ] シナリオ2（設定画面管理フロー）: `getAll()` → `search()` → `create()` → `update()` → `remove()` の全操作が動作する

**検証方法**:
- ユニットテストで各シナリオの流れを検証
- spec Section 6 の使用例に沿ったテスト

---

## 2. 仕様レビュー

### CHK-201 [P1] 公開APIの実装

- [ ] `getAll(): Exercise[]` が実装されている
- [ ] `search(query: string): Exercise[]` が実装されている
- [ ] `create(name: string): Exercise` が実装されている
- [ ] `update(id: string, name: string): Exercise` が実装されている
- [ ] `remove(id: string): void` が実装されている
- [ ] 全関数が `src/lib/exerciseRepository.ts` から export されている

**検証方法**:
```bash
grep "export function" src/lib/exerciseRepository.ts
```

**参照**: spec Section 4 API テーブル

---

### CHK-202 [P1] データモデルの整合性

- [ ] `Exercise` 型が `{ id: string; name: string }` として定義されている
- [ ] `id` は `crypto.randomUUID()` で生成される
- [ ] `name` はユーザー定義の文字列で一意（case-sensitive）

**検証方法**:
- `src/types/index.ts` の `Exercise` 型を spec Section 4.1 と比較

---

### CHK-203 [P1] 動作の整合性

- [ ] `search()`: query が空文字列/空白のみの場合に全件返す
- [ ] `search()`: 大文字小文字を区別しない部分一致検索
- [ ] `create()`: 空文字列/空白のみの name で `Error("Exercise name is empty")` をスロー
- [ ] `create()`: 重複名で `Error("Duplicate name: {name}")` をスロー
- [ ] `update()`: 空文字列/空白のみの name で `Error("Exercise name is empty")` をスロー
- [ ] `update()`: 存在しない ID で `Error("Exercise not found: {id}")` をスロー
- [ ] `update()`: 他種目と重複する名前で `Error("Duplicate name: {name}")` をスロー
- [ ] `remove()`: 存在しない ID で何もしない（冪等）
- [ ] `getAll()`: 登録順（配列順）で返す

**検証方法**:
- 各関数のユニットテストで正常系・異常系を検証
- spec Section 7 振る舞い図のフローと照合

---

### CHK-204 [P2] 制約事項の実装

- [ ] localStorage キーは `'gymini:exercises'` を使用（design Section 5）
- [ ] localStorage の JSON.parse を try-catch で囲み、失敗時は空配列を返す（T-002）
- [ ] ExerciseRepository は React を知らない純粋関数として実装されている（React の import なし）
- [ ] `search()` は case-insensitive、`create()`/`update()` の一意性は case-sensitive（意図的な非対称）

**検証方法**:
- コードレビューで localStorage キーと try-catch を確認
- import 文に React 関連がないことを確認

---

## 3. 設計レビュー

### CHK-301 [P1] アーキテクチャの整合性

- [ ] `src/lib/exerciseRepository.ts` に ExerciseRepository が配置されている
- [ ] ExerciseRepository は外部モジュール（workout, settings, ai-chat）に依存していない
- [ ] ExerciseRepository は他のドメインモジュールを import していない

**検証方法**:
- ファイル配置を design Section 4.2 と比較
- import 文に他ドメインモジュールがないことを確認

---

### CHK-302 [P1] 技術スタックの準拠

- [ ] TypeScript (.ts) で実装されている（T-001）
- [ ] localStorage (JSON) でデータ永続化（A-002）
- [ ] `crypto.randomUUID()` で ID 生成（外部ライブラリ不使用、A-001）

**検証方法**:
- ファイル拡張子が `.ts` であること
- 外部 ID 生成ライブラリの依存がないこと

---

### CHK-303 [P2] 設計判断の実装反映

- [ ] モジュールスコープ: Data Layer のみ（Hook・UI なし）
- [ ] `create(name)` / `update(id, name)`: オブジェクトラップなしの直接引数
- [ ] 初期データ: 空リスト（シードデータなし）
- [ ] B-002 確認ゲート: Repository 内に実装しない（呼び出し側の責務）
- [ ] remove/update 時のワークアウト記録: 何もしない（スナップショットセマンティクス）

**検証方法**:
- design Section 9.1 の 11 決定事項と実装を照合

---

## 4. 実装レビュー

### CHK-401 [P1] コード構造

- [ ] 全関数が独立した export 関数として実装されている（クラスやオブジェクトではない）
- [ ] `STORAGE_KEY` が定数として定義されている
- [ ] localStorage の読み書きロジックが内部ヘルパーとして集約されている

**検証方法**:
- コードレビュー
- リンター実行

---

### CHK-402 [P1] エラーハンドリング

- [ ] `create()`: 空名前 → `Error("Exercise name is empty")`
- [ ] `create()`: 重複名 → `Error("Duplicate name: {name}")`
- [ ] `update()`: 空名前 → `Error("Exercise name is empty")`
- [ ] `update()`: 存在しない ID → `Error("Exercise not found: {id}")`
- [ ] `update()`: 重複名 → `Error("Duplicate name: {name}")`
- [ ] localStorage 読み込み失敗 → 空配列にフォールバック（サイレント失敗なし）

**検証方法**:
- 各エラーケースのユニットテスト
- try-catch のフォールバック動作確認

---

### CHK-403 [P2] コード品質

- [ ] `any` 型が使用されていない（T-001 strict mode）
- [ ] 関数が単一責務である
- [ ] 重複コードがない（特に `create`/`update` のバリデーション共通化を検討）

**検証方法**:
- TypeScript コンパイラ strict モードでエラーなし
- 静的解析ツール実行

---

## 5. テストレビュー

### CHK-501 [P1] ユニットテストカバレッジ

- [ ] `getAll()`: 全件取得、空データ、localStorage 破損時フォールバック
- [ ] `search()`: 部分一致、空クエリで全件、空白のみクエリで全件、大文字小文字無視、一致なしで空配列
- [ ] `create()`: 正常登録、空名前エラー、重複名エラー、保存後 getAll で取得可能
- [ ] `update()`: 正常変更、空名前エラー、重複名エラー、存在しない ID エラー
- [ ] `remove()`: 正常削除、存在しない ID で何もしない
- [ ] カバレッジ >= 80%（D-001）

**検証方法**:
```bash
npx vitest --coverage src/lib/exerciseRepository.test.ts
```

**目標**: >= 80% ラインカバレッジ

---

### CHK-502 [P1] エッジケーステスト

- [ ] 空文字列 `""` を name に渡した場合のエラー
- [ ] 空白のみ `"   "` を name に渡した場合のエラー
- [ ] 空文字列 `""` を query に渡した場合の全件返却
- [ ] 空白のみ `"   "` を query に渡した場合の全件返却
- [ ] localStorage が空（キーなし）の場合の動作
- [ ] localStorage に不正 JSON が格納されている場合のフォールバック
- [ ] 同一 ID で `remove()` を2回呼んだ場合の冪等性

**検証方法**:
- 上記全ケースのユニットテストが存在すること

---

### CHK-503 [P1] 一意性チェックテスト

- [ ] 同一名での `create()` 連続呼び出しでエラー
- [ ] `update()` で他の既存種目名と同じ名前に変更しようとした場合のエラー
- [ ] `update()` で自分自身の現在の名前に変更した場合はエラーにならない
- [ ] case-sensitive: 「ベンチプレス」と「べんちぷれす」は別種目として登録可能
- [ ] case-insensitive search: 「ベンチ」で「ベンチプレス」がヒットする

**検証方法**:
- 上記全ケースのユニットテストが存在すること

---

## 6. ドキュメントレビュー

### CHK-601 [P2] コードコメント

- [ ] localStorage のエラーハンドリング理由がコメントされている（T-002 参照）
- [ ] case-sensitive/insensitive の非対称が意図的であることがコメントされている

**検証方法**:
- コードレビューでコメントの存在を確認

---

### CHK-602 [P2] 設計書の更新

- [ ] `index_design.md` の `impl-status` が `"implemented"` に更新されている
- [ ] 各関数のステータスが実装済みに更新されている
- [ ] 変更履歴に実装完了の記録がある

**検証方法**:
- design doc の front matter と Section 1 を確認

---

## 7. セキュリティレビュー

### CHK-701 [P1] 入力値検証

- [ ] `create()` / `update()` で空文字列・空白のみの name を拒否している
- [ ] name の trim 処理が適切に行われている
- [ ] localStorage への保存前に JSON.stringify が安全に実行される

**検証方法**:
- バリデーションロジックのコードレビュー
- 異常入力テスト

---

### CHK-702 [P1] データ保護（B-001 Privacy-by-Design）

- [ ] データが外部サーバーに送信されていない
- [ ] localStorage のみでデータが保存されている（A-002）
- [ ] API キーやシークレットがハードコードされていない

**検証方法**:
- コードに `fetch` / `XMLHttpRequest` / 外部 URL がないことを確認
- localStorage キー以外のストレージアクセスがないことを確認

---

## 8. パフォーマンスレビュー

### CHK-801 [P2] 検索レスポンスタイム

- [ ] `search()` が数百件規模のデータで 100ms 以内に応答する（NFR-002）
- [ ] `getAll()` + `Array.filter()` のインメモリ検索で実現されている

**検証方法**:
- 数百件のテストデータで `search()` の実行時間を計測
- ブラウザのパフォーマンスプロファイリング

**目標**: 100ms 以内（NFR-002）

---

## 完了基準

### PR作成前チェックリスト

すべての P1 項目が完了している必要があります:

- [ ] すべての P1 項目がチェック済み（14/14）
- [ ] すべてのテストが合格している
- [ ] 仕様との整合性が検証されている（`/check-spec exercise-master`）
- [ ] コードレビュー準備完了

### マージ前チェックリスト

すべての P1 と P2 項目が完了している必要があります:

- [ ] すべての P1 項目がチェック済み（14/14）
- [ ] すべての P2 項目がチェック済み（7/7）
- [ ] コードレビュー承認済み
- [ ] CI/CD パイプライングリーン
- [ ] マージ準備完了

---

## 参照ドキュメント

- PRD: [index.md](../../requirement/exercise-master/index.md)
- 抽象仕様書: [index_spec.md](../../specification/exercise-master/index_spec.md)
- 技術設計書: [index_design.md](../../specification/exercise-master/index_design.md)
- タスク分解: [tasks.md](tasks.md)
