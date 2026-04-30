---
id: "design-user-profile"
title: "ユーザープロフィール設定 技術設計書"
type: "design"
status: "approved"
created: "2026-04-30"
updated: "2026-04-30"
depends-on: ["spec-user-profile"]
tags: ["settings", "user-profile", "ai-chat"]
impl-status: "not-implemented"
---

# ユーザープロフィール設定 技術設計書

**仕様書:** [user-profile_spec.md](./user-profile_spec.md)

---

## 実装ステータス

| コンポーネント | ステータス | パス |
|:-------------|:---------|:----|
| userProfileStore | 未実装 | `src/stores/userProfileStore.ts` |
| buildSystemInstruction | 未実装 | `src/lib/geminiClient.ts` |
| useChatService 更新 | 未実装 | `src/hooks/useChatService.ts` |
| UserProfileSection | 未実装 | `src/components/settings/UserProfileSection.tsx` |
| SettingsContent 更新 | 未実装 | `src/components/settings/SettingsContent.tsx` |
| __root.tsx 更新 | 未実装 | `src/routes/__root.tsx` |

---

## モジュールアーキテクチャ

```
Route Layer (__root.tsx)
  → loadProfile() on mount

UI Layer (UserProfileSection)
  → useUserProfileStore.setProfile(patch) on input change (debounce 300ms)

Hook Layer (useChatService)
  → useUserProfileStore.getState() in sendMessage
  → buildSystemInstruction(profile) → createGeminiClient({ apiKey, systemInstruction })

Store Layer (userProfileStore)
  → getState() / setState() / localStorage CRUD

Lib Layer (geminiClient.ts)
  → buildSystemInstruction(profile): string  [pure function]
  → createGeminiClient({ apiKey, systemInstruction? })
```

---

## 1. `src/stores/userProfileStore.ts`

`settingsStore.ts` のパターンを踏襲し、Zustand persist middleware を使わず手動で localStorage を管理する。

```typescript
import { create } from 'zustand'
import { z } from 'zod'

const STORAGE_KEY = 'gymini:user-profile'

const TrainingGoalSchema = z.enum([
  'muscle_gain', 'strength', 'fat_loss', 'maintenance', 'performance',
])
export type TrainingGoal = z.infer<typeof TrainingGoalSchema>

const UserProfileSchema = z.object({
  birthYear:    z.number().int().min(1900).max(2025).nullable(),
  weightKg:     z.number().positive().max(300).nullable(),
  heightCm:     z.number().min(50).max(250).nullable(),
  trainingGoal: TrainingGoalSchema.nullable(),
})
export type UserProfile = z.infer<typeof UserProfileSchema>

const DEFAULT_PROFILE: UserProfile = {
  birthYear: null, weightKg: null, heightCm: null, trainingGoal: null,
}

// store型・実装は settingsStore.ts と同じパターン
```

**setProfile**: `Partial<UserProfile>` をマージしてから `safeParse` で検証後 localStorage に書き込む。

**loadProfile**: localStorage から JSON.parse し `safeParse`。`success: false` の場合は不正フィールドのみ null にフォールバック（`z.catch(null)` を各フィールドに適用）。

---

## 2. `src/lib/geminiClient.ts` 変更

### 2a. `GeminiClientConfig` に `systemInstruction?` を追加

```typescript
export type GeminiClientConfig = {
  apiKey: string
  toolDeclarations?: FunctionDeclaration[]
  systemInstruction?: string
}
```

`createGeminiClient` 内:
```typescript
systemInstruction: config.systemInstruction ?? SYSTEM_INSTRUCTION,
```

### 2b. `buildSystemInstruction` をエクスポート

```typescript
export function buildSystemInstruction(profile: UserProfile | null): string {
  // プロフィールが全 null または引数 null の場合は既存文字列をそのまま返す
  if (!profile || isAllNull(profile)) return SYSTEM_INSTRUCTION

  const lines: string[] = []
  if (profile.birthYear !== null) {
    const age = new Date().getFullYear() - profile.birthYear
    lines.push(`- 年齢: ${age}歳（${profile.birthYear}年生まれ）`)
  }
  if (profile.weightKg !== null) lines.push(`- 体重: ${profile.weightKg}kg`)
  if (profile.heightCm !== null) {
    let line = `- 身長: ${profile.heightCm}cm`
    if (profile.weightKg !== null) {
      const bmi = profile.weightKg / Math.pow(profile.heightCm / 100, 2)
      line += `（BMI: ${bmi.toFixed(1)}）`
    }
    lines.push(line)
  }
  if (profile.trainingGoal !== null) {
    lines.push(`- トレーニング目的: ${TRAINING_GOAL_LABELS[profile.trainingGoal]}`)
  }

  return `${SYSTEM_INSTRUCTION}\n\n## ユーザープロフィール\n${lines.join('\n')}\n\n上記の情報を踏まえてアドバイスやメニュー提案を個人化してください。`
}
```

`TRAINING_GOAL_LABELS` は geminiClient.ts 内の定数マップ（型安全に `Record<TrainingGoal, string>`）。

---

## 3. `src/hooks/useChatService.ts` 変更

### 3a. `CreateClient` 型変更

```typescript
type CreateClient = (apiKey: string, systemInstruction?: string) => GeminiClient
```

### 3b. `createClient` の useCallback

```typescript
const createClient = useCallback<CreateClient>(
  (apiKey, systemInstruction) =>
    options.createClient
      ? options.createClient(apiKey, systemInstruction)
      : createGeminiClient({ apiKey, systemInstruction }),
  [options],
)
```

### 3c. `sendMessage` でプロフィール注入

```typescript
const settings = useSettingsStore.getState()
const { profile } = useUserProfileStore.getState()
const systemInstruction = buildSystemInstruction(profile)
const client = createClient(settings.apiKey, systemInstruction)
```

---

## 4. `src/components/settings/UserProfileSection.tsx`

`APIKeySection.tsx` のパターンを参考にデバウンス付き自動保存を実装する。

**構造:**
```
SectionCard label="プロフィール"
  ├── 生まれ年行: label + input[type=number] + aria-label
  ├── 体重行:     label + input[type=number] + "kg" unit
  ├── 身長行:     label + input[type=number] + "cm" unit
  └── 目的行:     label + shadcn Select (5 options)
      + 保存ステータス (aria-live="polite")
```

**shadcn Select の採用:**
shadcn `<Select>` コンポーネント（`src/components/ui/select.tsx`）を使用。CLAUDE.md 規約によりラベル付き操作は shadcn `<Button>` / `<Select>` を第一選択とする。

**数値入力の空文字処理:**
`<input type="number">` の `value` は文字列。空文字列（フィールドクリア）は `null` として `setProfile` に渡す。

---

## 5. `src/components/settings/SettingsContent.tsx` 変更

`UserProfileSection` を先頭に追加するのみ。

---

## 6. `src/routes/__root.tsx` 変更

```typescript
const loadApiKey = useSettingsStore((s) => s.loadApiKey)
const loadProfile = useUserProfileStore((s) => s.loadProfile)

useEffect(() => {
  loadApiKey()
  loadProfile()
}, [loadApiKey, loadProfile])
```

---

## テスト戦略

| 対象 | テスト種別 | 内容 |
|:----|:---------|:----|
| `userProfileStore` | ユニット | `setProfile` / `loadProfile` / `clearProfile` / localStorage 失敗 / Zod バリデーション |
| `buildSystemInstruction` | ユニット | 全 null → 既存文字列返却、各フィールドの文字列生成、BMI 計算 |
| `UserProfileSection` | コンポーネント | 入力 → debounce → store 更新の確認 |

---

## 設計上の判断

| 判断 | 理由 |
|:----|:----|
| Zustand persist middleware を使わない | `settingsStore.ts` との一貫性。デバッグ容易性。Zod によるカスタムバリデーションを loadProfile に集中させるため |
| `buildSystemInstruction` を純粋関数で geminiClient.ts に同居 | テストが容易。システムインストラクションと同じファイルに置くことで凝集度を高める |
| `CreateClient` 型に `systemInstruction?` を追加 | 既存テストの `options.createClient` モックを破壊せずに型安全に拡張できる |
| プロフィールセクションを設定画面最上部に配置 | ユーザーが最初に目にする設定として重要度が高い |
| 全フィールド optional | B-001 プライバシー原則に沿い、強制入力を避けて心理的障壁を下げる |
