# 品質チェックリスト: APIキー管理

## メタ情報

| 項目 | 内容 |
|:---|:---|
| 機能名 | APIキー管理 |
| 対象仕様書 | `.sdd/specification/api-key/index_spec.md` |
| 対象設計書 | `.sdd/specification/api-key/index_design.md` |
| タスク分解 | `.sdd/task/api-key/tasks.md` |
| 生成日 | 2026-04-11 |
| チェックリストバージョン | 1.0 |

## チェックリストサマリー

| カテゴリ | 総項目数 | P1 | P2 | P3 |
|:---|:---|:---|:---|:---|
| 要求レビュー | 4 | 3 | 1 | 0 |
| 仕様レビュー | 4 | 3 | 1 | 0 |
| 設計レビュー | 3 | 2 | 1 | 0 |
| 実装レビュー | 3 | 2 | 1 | 0 |
| テストレビュー | 3 | 3 | 0 | 0 |
| セキュリティレビュー | 2 | 2 | 0 | 0 |
| **合計** | **19** | **15** | **4** | **0** |

**優先度レベル**:

- **P1**: 高 - マージ前に完了すべき
- **P2**: 中 - リリース前に完了すべき
- **P3**: 低 - あると望ましい

> **除外カテゴリ**: ドキュメントレビュー（タスク 5.1 で設計書更新としてカバー）、パフォーマンスレビュー（localStorage 直接操作のみでボトルネックなし）、デプロイレビュー（クライアントサイド完結、DB/マイグレーションなし）

---

## 1. 要求レビュー

### CHK-101 [P1] 機能要件の網羅性

- [ ] FR-001: `setApiKey()` で localStorage に保存できる
- [ ] FR-002: `loadApiKey()` で localStorage から読み込める
- [ ] FR-003: `deleteApiKey()` で localStorage から削除できる
- [ ] FR-004: `hasApiKey` が派生値として正しく公開される（`apiKey !== ''`）
- [ ] FR-005: `apiKey` の生値が公開され、UIレイヤーが表示/非表示を制御できる
- [ ] FR-006: アプリ起動時に `loadApiKey()` が自動呼び出しされる

**検証方法**:

- ユニットテストで各 FR を個別に検証
- `/check-spec api-key` で仕様との整合性を確認

**関連要求**: FR_008, FR_009, FR_010（PRD）

---

### CHK-102 [P1] 非機能要件

- [ ] NFR-001: settingsStore から外部サーバーへのネットワーク通信パスがないことを確認
- [ ] NFR-002: `setApiKey` / `deleteApiKey` / `loadApiKey` の全3メソッドで try-catch が実装されている

**検証方法**:

- コードレビューで外部通信の有無を確認
- ユニットテストで localStorage エラー時のフォールバックを検証

**関連要求**: NFR-001, NFR-002（spec）

---

### CHK-103 [P1] ユーザーシナリオの網羅性

- [ ] シナリオ1（APIキー保存）: setApiKey 後に hasApiKey === true、GearIcon バッジが非表示
- [ ] シナリオ2（起動時読み込み）: 既存キーがストアに反映される
- [ ] シナリオ3（APIキー削除）: deleteApiKey 後に hasApiKey === false
- [ ] シナリオ4（AI チャット参照）: useSettingsStore() で apiKey / hasApiKey が取得可能

**検証方法**:

- spec Section 6 の各シナリオに対応するテストケースが存在することを確認

---

### CHK-104 [P2] PRD との整合性

- [ ] PRD（prd-api-key）の FR_008 / FR_009 / FR_010 が全てタスクでカバーされている
- [ ] PRD の「セキュリティ制約（B-001準拠）」が実装に反映されている

**検証方法**:

```bash
/check-spec api-key
```

---

## 2. 仕様レビュー

### CHK-201 [P1] 公開 API の実装

- [ ] `useSettingsStore` が `src/stores/settingsStore.ts` からエクスポートされている
- [ ] `apiKey: string` — 初期値 `''`
- [ ] `hasApiKey: boolean` — `apiKey !== ''` の派生値
- [ ] `setApiKey(key: string): void` — localStorage 書き込み + ストア更新
- [ ] `deleteApiKey(): void` — localStorage 削除 + ストアリセット
- [ ] `loadApiKey(): void` — localStorage 読み込み + ストア反映

**検証方法**:

```bash
# 型チェックで API シグネチャを確認
npx tsc --noEmit
```

**参照**: spec Section 4（API）

---

### CHK-202 [P1] 型定義の整合性

- [ ] `SettingsState` 型が spec Section 4.1 と一致（`apiKey: string`, `hasApiKey: boolean`）
- [ ] `SettingsActions` 型が spec Section 4.1 と一致（`setApiKey`, `deleteApiKey`, `loadApiKey`）
- [ ] `any` 型を使用していない（T-001: TypeScript Strict Mode）

**検証方法**:

- 実装の型定義と spec の型定義を目視比較
- `npx tsc --noEmit` で型エラーなし

---

### CHK-203 [P1] 振る舞いの整合性

- [ ] setApiKey: localStorage.setItem → set() の順序（spec 7.1 シーケンス図）
- [ ] deleteApiKey: localStorage.removeItem → set() の順序（spec 7.2 シーケンス図）
- [ ] loadApiKey: localStorage.getItem → alt 分岐（キー有無）→ set()（spec 7.3 シーケンス図）
- [ ] localStorage エラー時のフォールバックが全メソッドで実装（spec 7.3 else 分岐）

**検証方法**:

- コードフローを spec のシーケンス図と比較

---

### CHK-204 [P2] 制約の実装

- [ ] ストレージキーが `'gymini:api-key'` である（spec Section 8）
- [ ] 保存形式がプレーンテキスト（JSON ではない）（design Section 5）
- [ ] `setApiKey('')` が呼び出されないようガード or ドキュメント化されている（spec Section 4）

**検証方法**:

- コードレビューで定数値・保存形式を確認

---

## 3. 設計レビュー

### CHK-301 [P1] アーキテクチャの整合性

- [ ] `src/stores/settingsStore.ts` にストアが配置されている（design Section 4.2）
- [ ] Zustand `create()` でストアが作成されている（persist ミドルウェア不使用）
- [ ] UIコンポーネントを含まない（State Layer のみ）

**検証方法**:

- ファイル配置を design Section 4.2 と比較
- import 文に React コンポーネントの import がないことを確認

---

### CHK-302 [P1] 技術スタックの準拠

- [ ] Zustand ^5 を使用（design Section 3）
- [ ] localStorage を直接操作（persist ミドルウェア不使用）
- [ ] 未承認の依存関係が追加されていない

**検証方法**:

```bash
# package.json の依存関係を確認
cat package.json | grep zustand
```

---

### CHK-303 [P2] 初期化タイミングの整合性

- [ ] `loadApiKey()` が `src/routes/__root.tsx` の `useEffect` 内で呼び出されている（design Section 6）
- [ ] ストア作成時（モジュールロード時）に localStorage アクセスしていない（SSR 互換性、design Section 9.1）

**検証方法**:

- `__root.tsx` のコードを確認
- settingsStore の `create()` 内で localStorage アクセスがないことを確認

---

## 4. 実装レビュー

### CHK-401 [P1] コード構造

- [ ] ファイル名が `settingsStore.ts`（`.tsx` ではなく `.ts`、design Section 3）
- [ ] エクスポート名が `useSettingsStore`（design Section 6）
- [ ] `STORAGE_KEY` が定数として定義されている（マジックストリング不使用）
- [ ] デッドコード・コメントアウトされたブロックがない

**検証方法**:

```bash
npx eslint src/stores/settingsStore.ts
```

---

### CHK-402 [P1] エラーハンドリング

- [ ] `setApiKey`: try-catch で localStorage.setItem を保護。失敗時もストア状態は更新する（design Section 6）
- [ ] `deleteApiKey`: try-catch で localStorage.removeItem を保護。失敗時もストアはリセットする
- [ ] `loadApiKey`: try-catch で localStorage.getItem を保護。失敗時は `{ apiKey: '', hasApiKey: false }` にフォールバック

**検証方法**:

- ユニットテストで `Storage.prototype` をモックしてエラーケースを検証

---

### CHK-403 [P2] コード品質

- [ ] 関数が単一責務（各メソッドが1つの操作のみ）
- [ ] 重複コードがない（try-catch パターンの共通化は不要 — 3メソッドのみ）
- [ ] ESLint エラーなし

**検証方法**:

```bash
npx eslint src/stores/settingsStore.ts
npx tsc --noEmit
```

---

## 5. テストレビュー

### CHK-501 [P1] ユニットテストカバレッジ

- [ ] `setApiKey`: 正常保存テスト（localStorage に書き込まれ、hasApiKey === true）
- [ ] `setApiKey`: localStorage エラー時テスト（ストア状態は更新される）
- [ ] `loadApiKey`: キー存在時テスト（apiKey に値がセット、hasApiKey === true）
- [ ] `loadApiKey`: キー不在時テスト（apiKey === '', hasApiKey === false）
- [ ] `loadApiKey`: localStorage エラー時テスト（デフォルト値にフォールバック）
- [ ] `deleteApiKey`: 正常削除テスト（localStorage から削除、hasApiKey === false）
- [ ] `deleteApiKey`: localStorage エラー時テスト（ストア状態はリセットされる）
- [ ] `hasApiKey`: setApiKey 後に true、deleteApiKey 後に false、空文字時に false

**検証方法**:

```bash
npx vitest run src/stores/settingsStore.test.ts --coverage
```

**目標**: 100% ライン・ブランチカバレッジ（モジュールが小さいため）

**参照**: design Section 8（テスト戦略）

---

### CHK-502 [P1] テスト技法の適切性

- [ ] localStorage モックに `vi.spyOn(Storage.prototype, ...)` を使用（design Section 8）
- [ ] 各テスト前に `useSettingsStore.setState({ apiKey: '', hasApiKey: false })` でストアをリセット
- [ ] エラーケースは `mockImplementation(() => { throw new Error(...) })` で再現

**検証方法**:

- テストコードのレビュー

---

### CHK-503 [P1] エッジケーステスト

- [ ] 空文字列 `''` でのストア状態（hasApiKey === false）
- [ ] 非常に長いAPIキー文字列での動作
- [ ] localStorage に既存キーがある状態で `setApiKey` を上書き呼び出し
- [ ] `loadApiKey` を連続2回呼び出しても冪等

**検証方法**:

- エッジケーステストケースの存在を確認

---

## 6. セキュリティレビュー

### CHK-701 [P1] データ保護（B-001: Privacy-by-Design）

- [ ] APIキーが localStorage にのみ保存されている（外部サーバー・中間サーバー・第三者サービスに送信しない）
- [ ] settingsStore のコードに `fetch` / `XMLHttpRequest` / `axios` 等のネットワーク呼び出しがない
- [ ] APIキーがハードコードされていない
- [ ] console.log でAPIキーを出力していない

**検証方法**:

```bash
# settingsStore 内のネットワーク呼び出しを検索
grep -E "(fetch|XMLHttpRequest|axios|http)" src/stores/settingsStore.ts
# コンソール出力を検索
grep "console\." src/stores/settingsStore.ts
```

---

### CHK-702 [P1] クライアントサイド完結性（A-002）

- [ ] モジュールがサーバーサイドのエンドポイントを呼び出していない
- [ ] 環境変数経由でのAPIキー注入がない（BYOK モデル = ユーザー入力のみ）

**検証方法**:

- コードレビューで import / 外部依存を確認

---

## 完了基準

### PR作成前チェックリスト

すべての P1 項目が完了している必要があります:

- [ ] すべての P1 項目がチェック済み（15/15）
- [ ] すべてのテストが pass している
- [ ] `npx tsc --noEmit` でエラーなし
- [ ] `npx eslint src/stores/settingsStore.ts` でエラーなし
- [ ] 仕様との整合性が検証されている（`/check-spec api-key`）

### マージ前チェックリスト

すべての P1 と P2 項目が完了している必要があります:

- [ ] すべての P1 項目がチェック済み（15/15）
- [ ] すべての P2 項目がチェック済み（4/4）
- [ ] コードレビュー承認済み
- [ ] CI パイプライングリーン

---

## 参照ドキュメント

- PRD: [index.md](../../requirement/api-key/index.md)
- 抽象仕様書: [index_spec.md](../../specification/api-key/index_spec.md)
- 技術設計書: [index_design.md](../../specification/api-key/index_design.md)
- タスク分解: [tasks.md](tasks.md)
