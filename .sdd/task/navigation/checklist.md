# 品質チェックリスト: ページナビゲーション

## メタ情報

| 項目 | 内容 |
|:---|:---|
| 機能名 | ページナビゲーション |
| 対象仕様書 | `.sdd/specification/navigation_spec.md` |
| 対象設計書 | `.sdd/specification/navigation_design.md` |
| PRD | `.sdd/requirement/navigation.md` |
| 生成日 | 2026-04-11 |
| チェックリストバージョン | 1.0 |

## チェックリストサマリー

| カテゴリ | 総項目数 | P1 | P2 | P3 |
|:---|:---|:---|:---|:---|
| 要求レビュー | 3 | 2 | 1 | 0 |
| 仕様レビュー | 5 | 4 | 1 | 0 |
| 設計レビュー | 4 | 3 | 1 | 0 |
| 実装レビュー | 4 | 3 | 1 | 0 |
| テストレビュー | 4 | 3 | 1 | 0 |
| ドキュメントレビュー | 2 | 0 | 2 | 0 |
| セキュリティレビュー | 1 | 1 | 0 | 0 |
| パフォーマンスレビュー | 2 | 1 | 1 | 0 |
| **合計** | **25** | **17** | **8** | **0** |

**優先度レベル**:

- **P1**: 高 - マージ前に完了すべき
- **P2**: 中 - リリース前に完了すべき
- **P3**: 低 - あると望ましい

---

## 1. 要求レビュー

### CHK-101 [P1] 機能要件の網羅性（ルーティング・ページ）

- [ ] FR-001: TrainingPage がセッション非アクティブ時に IdleView（FRAME1）を表示する
- [ ] FR-002: TrainingPage がセッションアクティブ時に ActiveSessionView（FRAME2）を表示する
- [ ] FR-003: HistoryPage（FRAME3）が `/history` ルートで表示される
- [ ] FR-004: AIChatPage（FRAME4）が `/ai` ルートで表示され、BottomNav の AI ボタンから常時アクセス可能
- [ ] FR-005: SettingsPage（FRAME5）が歯車アイコンから遷移可能、X ボタンまたはブラウザバックで遷移元に戻れる
- [ ] FR-006: セッションデータがページ遷移・リロード間で永続化される
- [ ] FR-012: 4つの論理ルート（/training, /history, /ai, /settings）がクライアントサイドで切り替わる

**検証方法**:
- PRD FR_017〜FR_020, IR_001, IR_002, DC_005 と実装を照合
- `/check-spec navigation` で整合性を検証

**関連要求**: FR_017, FR_018, FR_019, FR_020, DC_005

---

### CHK-102 [P1] インターフェース要件の網羅性（BottomNav・GearIcon）

- [ ] FR-007: BottomNav で Training / History タブと AI ボタンが FRAME1〜4 で常に表示される
- [ ] FR-008: BottomNav が FRAME5（/settings）では非表示
- [ ] FR-009: 歯車アイコンが FRAME1〜4 の右上に固定表示される
- [ ] FR-010: 歯車アイコンに APIキー未設定時の赤バッジが表示される
- [ ] FR-011: FRAME2 では歯車アイコンの右隣に「終了」ボタン、ボタン群の下にタイマーpill が表示される

**検証方法**:
- 各 FRAME でのビジュアルインスペクション
- design-system.html との目視比較

**関連要求**: IR_001, IR_002

---

### CHK-103 [P2] 非機能要件

- [ ] NFR-001: ルーティング遷移開始からナビゲーション更新完了まで 16ms 以内（60fps 相当）
- [ ] NFR-002: セッション中のページ遷移・リロードでデータが完全に復元される
- [ ] NFR-003: BottomNav のレイアウト（タブ構成・AI ボタン位置）が全画面で一貫している

**検証方法**:
- パフォーマンスプロファイリング（NFR-001）
- リロードテスト（NFR-002）
- 全 FRAME でのレイアウトインスペクション（NFR-003）

---

## 2. 仕様レビュー

### CHK-201 [P1] ルートファイル構成

- [ ] `src/routes/__root.tsx` が存在し、`createRootRoute` で Outlet を返す
- [ ] `src/routes/_app.tsx` が pathless layout route として存在し、GearIcon + Outlet + BottomNav を配置
- [ ] `src/routes/_app/training.tsx` が `/training` ルートとして登録されている
- [ ] `src/routes/_app/history.tsx` が `/history` ルートとして登録されている
- [ ] `src/routes/_app/ai.tsx` が `/ai` ルートとして登録されている
- [ ] `src/routes/settings.tsx` が layout 外の `/settings` ルートとして登録されている
- [ ] `routeTree.gen.ts` が自動生成されている

**検証方法**:
```bash
ls src/routes/__root.tsx src/routes/_app.tsx src/routes/_app/training.tsx src/routes/_app/history.tsx src/routes/_app/ai.tsx src/routes/settings.tsx
```

**参照**: design Section 4.2 ルートファイル表

---

### CHK-202 [P1] BottomNav コンポーネント仕様準拠

- [ ] TanStack Router の `Link` コンポーネントで 3つのナビゲーション要素を実装
- [ ] タブ1: `/training`、ラベル「トレ」、アイコン `PhBarbell`
- [ ] タブ2: `/history`、ラベル「履歴」、アイコン `PhClockCounterClockwise`
- [ ] AI ボタン: `/ai`、pill 型デザイン（`bg-black rounded-2xl`）、アイコン `PhRobot`
- [ ] `activeProps` / `inactiveProps` でアクティブ状態のスタイル切り替え
- [ ] AI ボタンアクティブ時: `bg-accent shadow-red-200`
- [ ] 固定配置: `fixed bottom-0 w-full h-24 bg-white/80 backdrop-blur-xl`

**検証方法**:
- コンポーネントテスト + design-system.html との目視比較

**参照**: spec Section 6, design Section 6 BottomNav

---

### CHK-203 [P1] GearIcon コンポーネント仕様準拠

- [ ] TanStack Router の `Link to="/settings"` で実装
- [ ] 位置: `absolute top-12 right-4 z-30`
- [ ] サイズ: `w-9 h-9`（視覚）、タッチ領域: `min-h-[44px] min-w-[44px]`（T-003）
- [ ] APIキー未設定バッジ: `w-3 h-3 bg-accent rounded-full`
- [ ] `GearIconProps`: `showEndButton?`, `elapsedTime?`, `onEndSession?` をサポート
- [ ] FRAME2 追加要素: 終了ボタン（`text-accent bg-red-50/90`）+ タイマーpill

**検証方法**:
- コンポーネントテスト（バッジ表示/非表示、FRAME2 props）

**参照**: design Section 6 GearIcon

---

### CHK-204 [P1] SettingsPage 戻りナビゲーション

- [ ] `useRouter` + `useCanGoBack` で戻りナビゲーションを実装
- [ ] `canGoBack` が true の場合: `router.history.back()` で遷移元に戻る
- [ ] `canGoBack` が false の場合（直接アクセス）: `/training` にフォールバック
- [ ] X ボタン: `absolute top-12 right-4 z-30`、`ph-bold ph-x`
- [ ] タッチ領域: `min-h-[44px] min-w-[44px]`（T-003）

**検証方法**:
- ユニットテスト: canGoBack true/false の分岐
- E2E テスト: ブラウザバックボタンでの戻り動作

**参照**: spec Section 6, design Section 6 SettingsPage

---

### CHK-205 [P2] デフォルトルートリダイレクト

- [ ] `/` アクセス時に `/training` にリダイレクトされる
- [ ] `__root.tsx` の `beforeLoad` でリダイレクトを実装

**検証方法**:
- ブラウザで `/` にアクセスして `/training` に遷移することを確認

---

## 3. 設計レビュー

### CHK-301 [P1] アーキテクチャの整合性

- [ ] TanStack Router ファイルベースルーティングで実装（A-001 準拠）
- [ ] pathless layout route (`_app.tsx`) で BottomNav / GearIcon の表示を構造的に制御
- [ ] `/settings` は layout 外に配置（手動条件分岐 `{route !== 'settings' && ...}` を使用していない）
- [ ] `navigationStore.ts` / `useNavigation.ts` / Route 手動型定義が廃止されている

**検証方法**:
- ファイル構造を design Section 4.2 と比較
- `grep -r "navigationStore\|useNavigation\|type Route" src/` で旧モジュール残存チェック

---

### CHK-302 [P1] 技術スタックの準拠

- [ ] `@tanstack/react-router` がインストールされている
- [ ] `@tanstack/router-plugin` が devDependencies にインストールされている
- [ ] `vite.config.ts` に `tanstackRouter` プラグインが追加されている（`autoCodeSplitting: true`）
- [ ] `@phosphor-icons/react` がインストールされている
- [ ] `lucide-react` が削除されている（存在しないこと）
- [ ] TanStack Start は使用していない（A-002）

**検証方法**:
```bash
cat package.json | grep -E "tanstack|phosphor|lucide"
grep "tanstackRouter" vite.config.ts
```

---

### CHK-303 [P1] main.tsx の RouterProvider 設定

- [ ] `createRouter({ routeTree })` でルーターが作成されている
- [ ] `RouterProvider` でアプリがラップされている
- [ ] `Register` 型の `declare module` 拡張が実装されている

**検証方法**:
- `src/main.tsx` のコードレビュー

---

### CHK-304 [P2] 設計判断の実装反映

- [ ] ルーティング: TanStack Router ファイルベース（Zustand 状態ベースでない）
- [ ] layout route: pathless layout（手動条件分岐でない）
- [ ] settings 戻り: ブラウザ履歴（自前 previousRoute 管理でない）
- [ ] BottomNav 第3要素: AI 専用ボタン（FAB でない）
- [ ] アイコン: Phosphor Icons（lucide-react でない）
- [ ] TanStack Start: 未使用（SSR/SSG なし）
- [ ] persist 対象: partialize でドラフトのみ
- [ ] デフォルトルート: `/` → `/training` リダイレクト

**検証方法**:
- design Section 9.1 の 10 決定事項と実装を照合

---

## 4. 実装レビュー

### CHK-401 [P1] コンポーネント配置

- [ ] `src/components/BottomNav.tsx` が存在する
- [ ] `src/components/GearIcon.tsx` が存在する
- [ ] `src/pages/TrainingPage.tsx` が存在する（workout モジュール実装）
- [ ] `src/components/IdleView.tsx` が存在する（workout モジュール実装）
- [ ] `src/pages/HistoryPage.tsx` が存在する
- [ ] `src/pages/AIChatPage.tsx` が存在する
- [ ] `src/pages/SettingsPage.tsx` が存在する

**検証方法**:
- design Section 4.2 UI コンポーネント表とファイル配置を照合

---

### CHK-402 [P1] Layout Route の構造的制御

- [ ] `_app.tsx` 内で `GearIcon` → `<main>` + `Outlet` → `BottomNav` の順に配置
- [ ] `<main>` に `flex-1 pb-24` が適用されている（BottomNav 分のパディング）
- [ ] FRAME1〜4 ルートが `_app/` ディレクトリ配下に配置されている
- [ ] `/settings` ルートが `_app/` の外に配置されている

**検証方法**:
- `src/routes/_app.tsx` のコードレビュー
- `ls src/routes/_app/ src/routes/settings.tsx`

---

### CHK-403 [P1] タップターゲットサイズ（T-003）

- [ ] BottomNav の全タブ/ボタンのタッチ領域が 44px x 44px 以上
- [ ] 歯車アイコンのタッチ領域が `min-h-[44px] min-w-[44px]`
- [ ] SettingsPage の X ボタンのタッチ領域が `min-h-[44px] min-w-[44px]`
- [ ] AI ボタンの高さが `h-11`（44px）以上

**検証方法**:
- Tailwind クラスでサイズを確認
- ブラウザ DevTools でタッチ領域を測定

---

### CHK-404 [P2] Zustand persist 設定（workoutSessionStore）

- [ ] `persist` ミドルウェアが workoutSessionStore に追加されている
- [ ] `name: 'gymini:workout-session'` のキーを使用
- [ ] `partialize` で `isActive`, `startedAt`, `draftExercises` のみ永続化
- [ ] `onRehydrateStorage` でパースエラー時のフォールバックが実装されている（T-002）

**検証方法**:
- `src/stores/workoutSessionStore.ts` のコードレビュー
- localStorage エラー時のフォールバック動作テスト

**参照**: design Section 6 workoutSessionStore

---

## 5. テストレビュー

### CHK-501 [P1] コンポーネントテスト

- [ ] BottomNav: 3つのナビゲーション要素が表示される
- [ ] BottomNav: アクティブ状態のスタイルが正しく切り替わる
- [ ] BottomNav: AI ボタンのアクティブ時に `bg-accent` が適用される
- [ ] GearIcon: 通常表示（バッジなし）
- [ ] GearIcon: APIキー未設定時に赤バッジ表示
- [ ] GearIcon: `showEndButton=true` で終了ボタン表示
- [ ] GearIcon: `elapsedTime` でタイマーpill 表示
- [ ] TrainingPage: セッション非アクティブ → IdleView（FR-001）
- [ ] TrainingPage: セッションアクティブ → ActiveSessionView（FR-002）

**検証方法**:
```bash
npx vitest run src/components/BottomNav.test.tsx
npx vitest run src/components/GearIcon.test.tsx
npx vitest run src/pages/TrainingPage.test.tsx
```

---

### CHK-502 [P1] 統合テスト: ルート遷移

- [ ] `/training` → `/history` → `/ai` → `/settings` → back の遷移が動作する
- [ ] FRAME1〜4 で BottomNav + GearIcon が表示される
- [ ] `/settings` で BottomNav + GearIcon が非表示になる（FR-008）
- [ ] settings の X ボタンで遷移元に戻れる（FR-005）
- [ ] `/settings` 直接アクセス時に X ボタンで `/training` にフォールバック

**検証方法**:
- TanStack Router テスト環境でのルート遷移テスト

---

### CHK-503 [P1] 統合テスト: セッション永続化

- [ ] セッション中にページ遷移（/training → /history → /training）してもデータが維持される
- [ ] ブラウザリロード後にセッションデータが復元される
- [ ] localStorage 破損時にデフォルト初期状態にフォールバックする（T-002）

**検証方法**:
- persist ミドルウェアのリハイドレーションテスト

---

### CHK-504 [P2] E2E テスト（Playwright）

- [ ] ナビゲーション全体フロー: タブ遷移 → AI ボタン遷移
- [ ] 歯車アイコン → /settings → X ボタンで戻り
- [ ] セッション中のページ遷移でデータ維持
- [ ] ブラウザバックボタンで /settings から戻れる

**検証方法**:
```bash
npx playwright test navigation
```

---

## 6. ドキュメントレビュー

### CHK-601 [P2] コードコメント

- [ ] ルートファイル（`__root.tsx`, `_app.tsx`）に layout route パターンの説明がコメントされている
- [ ] GearIcon の FRAME2 追加要素（終了ボタン・タイマー）の責務分担がコメントされている

**検証方法**:
- コードレビューでコメントの存在を確認

---

### CHK-602 [P2] 設計書の更新

- [ ] `navigation_design.md` の `impl-status` が `"implemented"` に更新されている
- [ ] 各モジュールのステータスが実装済みに更新されている
- [ ] 変更履歴に実装完了の記録がある

**検証方法**:
- design doc の front matter と Section 1 を確認

---

## 7. セキュリティレビュー

### CHK-701 [P1] データ保護（B-001 Privacy-by-Design）

- [ ] セッションデータが localStorage のみに保存されている（外部送信なし）
- [ ] `persist` の `partialize` でドラフト状態のみ永続化（過剰な情報の永続化なし）
- [ ] API キーが settingsStore に保持され、外部送信されていない

**検証方法**:
- コードに `fetch` / `XMLHttpRequest` / 外部 URL への送信がないことを確認
- persist 対象が `partialize` で限定されていることを確認

---

## 8. パフォーマンスレビュー

### CHK-801 [P1] ルート遷移速度（NFR-001）

- [ ] ルート遷移開始からナビゲーションコンポーネント更新完了まで 16ms 以内
- [ ] TanStack Router の `autoCodeSplitting` が有効で、ルート別遅延読み込みが動作する
- [ ] ルート遷移がクライアントサイド完結でネットワーク通信なし

**検証方法**:
- Chrome DevTools Performance パネルでルート遷移を計測
- Network タブでルート遷移時のリクエストがないことを確認

**目標**: 16ms（=1 フレーム @60fps）

---

### CHK-802 [P2] レイアウト安定性（NFR-003）

- [ ] BottomNav のタブ構成・AI ボタン位置がルート遷移で変化しない
- [ ] BottomNav の高さが全画面で `h-24` で一定
- [ ] GearIcon の位置が全画面で `top-12 right-4` で一定

**検証方法**:
- 全 FRAME でのビジュアルインスペクション
- Cumulative Layout Shift (CLS) の計測

---

## 完了基準

### PR作成前チェックリスト

すべての P1 項目が完了している必要があります:

- [ ] すべての P1 項目がチェック済み（17/17）
- [ ] すべてのテストが合格している
- [ ] 仕様との整合性が検証されている（`/check-spec navigation`）
- [ ] コードレビュー準備完了

### マージ前チェックリスト

すべての P1 と P2 項目が完了している必要があります:

- [ ] すべての P1 項目がチェック済み（17/17）
- [ ] すべての P2 項目がチェック済み（8/8）
- [ ] コードレビュー承認済み
- [ ] CI/CD パイプライングリーン
- [ ] マージ準備完了

---

## 参照ドキュメント

- PRD: [navigation.md](../../requirement/navigation.md)
- 抽象仕様書: [navigation_spec.md](../../specification/navigation_spec.md)
- 技術設計書: [navigation_design.md](../../specification/navigation_design.md)
- タスク分解: [tasks.md](tasks.md)
