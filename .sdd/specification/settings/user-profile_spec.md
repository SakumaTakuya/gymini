---
id: "spec-user-profile"
title: "ユーザープロフィール設定 抽象仕様書"
type: "spec"
status: "approved"
created: "2026-04-30"
updated: "2026-04-30"
depends-on: ["spec-settings", "spec-ai-chat"]
tags: ["settings", "user-profile", "ai-chat"]
impl-status: "not-implemented"
---

# ユーザープロフィール設定 抽象仕様書

**PRD:** [user-profile.md](../../requirement/settings/user-profile.md)

---

## 機能要求

### FR-001: プロフィールデータ型

```typescript
type TrainingGoal =
  | 'muscle_gain'   // 筋肥大（サイズアップ）
  | 'strength'      // 筋力アップ（パワー）
  | 'fat_loss'      // 減量・ダイエット
  | 'maintenance'   // 維持・健康増進
  | 'performance'   // 競技パフォーマンス向上

type UserProfile = {
  birthYear:    number | null  // 1900〜2025
  weightKg:     number | null  // 1〜300
  heightCm:     number | null  // 50〜250
  trainingGoal: TrainingGoal | null
}
```

全フィールドが任意（null 可）。

### FR-002: プロフィールストア

```typescript
// useUserProfileStore
type UserProfileState = {
  profile: UserProfile
}

type UserProfileActions = {
  setProfile: (patch: Partial<UserProfile>) => void
  clearProfile: () => void
  loadProfile: () => void
}
```

- `setProfile`: 既存の profile にパッチマージして localStorage へ保存
- `loadProfile`: localStorage から読み込み、Zod スキーマで検証（不正値は null に変換）
- `clearProfile`: 全フィールドを null にリセット
- localStorage 操作失敗時（T-002）はエラーをサイレントに処理してデフォルト値を維持

### FR-003: プロフィールの永続化

- localStorage キー: `'gymini:user-profile'`
- Zod スキーマで JSON バリデーション（不正値フィールドを null にフォールバック）

### FR-004: AI システムインストラクション生成

```typescript
// geminiClient.ts からエクスポート
buildSystemInstruction(profile: UserProfile | null): string
```

- プロフィールが全 null または引数 null の場合: 既存の `SYSTEM_INSTRUCTION` をそのまま返す
- 1 項目以上入力されている場合: `SYSTEM_INSTRUCTION` の末尾にユーザー情報ブロックを追記

**追記されるブロック例:**
```
## ユーザープロフィール
- 年齢: 35歳（1990年生まれ）
- 体重: 70kg
- 身長: 175cm（BMI: 22.9）
- トレーニング目的: 筋肥大（サイズアップ）

上記の情報を踏まえてアドバイスやメニュー提案を個人化してください。
```

- 未入力フィールドは行を省略する
- 生まれ年のみ入力の場合: 年齢を `現在年 - 生まれ年` で計算して表示
- 体重・身長が両方入力されている場合: BMI `= 体重 / (身長/100)²` を小数点 1 桁で追記

### FR-005: Gemini クライアントへの注入

`GeminiClientConfig` に `systemInstruction?: string` を追加する。

```typescript
type GeminiClientConfig = {
  apiKey: string
  toolDeclarations?: FunctionDeclaration[]
  systemInstruction?: string  // 追加
}
```

`createGeminiClient` 内で `config.systemInstruction ?? SYSTEM_INSTRUCTION` を使用する。

### FR-006: useChatService での組み込み

`sendMessage` 内で以下を実行する:

1. `useUserProfileStore.getState()` でプロフィール取得
2. `buildSystemInstruction(profile)` でシステムインストラクション生成
3. `createClient(settings.apiKey, systemInstruction)` でクライアント生成

`CreateClient` 型を `(apiKey: string, systemInstruction?: string) => GeminiClient` に変更する。

### FR-007: 設定画面 UI

- `UserProfileSection` コンポーネントを設定画面最上部に配置
- 各入力フィールドは `SectionCard` でラップ（ラベル: `"プロフィール"`）
- 変更時は debounce 300ms で `setProfile` を呼び出す
- 保存ステータス（`saving → saved → idle`）を `aria-live="polite"` で通知

### FR-008: アプリ起動時のプロフィール読み込み

`__root.tsx` の `RootLayout` で `loadProfile` を `loadApiKey` と同様に `useEffect` で呼び出す。

---

## 非機能要求

- **NFR-001:** プロフィール情報は localStorage にのみ保存。Gemini API 以外へは送信しない（B-001）
- **NFR-002:** 全フィールド null の場合は既存システムインストラクションをそのまま使用し、AI 動作に変化なし（FR_034）
- **NFR-003:** localStorage 操作失敗時はデフォルト（全 null）にフォールバック（T-002）
- **NFR-004:** 全インタラクティブ要素のタップターゲット最低 44px（T-003）
- **NFR-005:** `focus-ring` ユーティリティを生 `<button>` に付与（CLAUDE.md キーボードフォーカス規約）

---

## 制約

- プロフィールは任意入力。未入力でも全機能が正常動作すること
- `useUserProfileStore` は Zustand persist middleware を使わず、`settingsStore.ts` と同じ手動 localStorage パターンを採用（一貫性確保）
- `buildSystemInstruction` は純粋関数（副作用なし、テスト容易）
