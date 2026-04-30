import { create } from 'zustand'
import { z } from 'zod'

const STORAGE_KEY = 'gymini:user-profile'

export const TRAINING_GOALS = [
  'muscle_gain',
  'strength',
  'fat_loss',
  'maintenance',
  'performance',
] as const

const TrainingGoalSchema = z.enum(TRAINING_GOALS)
export type TrainingGoal = z.infer<typeof TrainingGoalSchema>

const UserProfileSchema = z.object({
  birthYear: z.number().int().min(1900).max(2025).nullable().catch(null),
  weightKg: z.number().positive().max(300).nullable().catch(null),
  heightCm: z.number().min(50).max(250).nullable().catch(null),
  trainingGoal: TrainingGoalSchema.nullable().catch(null),
})

export type UserProfile = z.infer<typeof UserProfileSchema>

const DEFAULT_PROFILE: UserProfile = {
  birthYear: null,
  weightKg: null,
  heightCm: null,
  trainingGoal: null,
}

type UserProfileState = {
  profile: UserProfile
}

type UserProfileActions = {
  setProfile: (patch: Partial<UserProfile>) => void
  clearProfile: () => void
  loadProfile: () => void
}

export const useUserProfileStore = create<UserProfileState & UserProfileActions>()(
  (set, get) => ({
    profile: { ...DEFAULT_PROFILE },

    setProfile: (patch: Partial<UserProfile>) => {
      const next = { ...get().profile, ...patch }
      const parsed = UserProfileSchema.safeParse(next)
      const validated = parsed.success ? parsed.data : UserProfileSchema.parse(
        // フィールドごとに catch(null) が働くので parse は常に成功する
        next,
      )
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validated))
      } catch {
        // T-002: localStorage 書き込み失敗時も状態は更新する
      }
      set({ profile: validated })
    },

    clearProfile: () => {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // T-002: localStorage 削除失敗時も状態はリセットする
      }
      set({ profile: { ...DEFAULT_PROFILE } })
    },

    loadProfile: () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) {
          set({ profile: { ...DEFAULT_PROFILE } })
          return
        }
        const json: unknown = JSON.parse(raw)
        // catch(null) により各フィールドが不正でも安全にパースされる
        const parsed = UserProfileSchema.parse(json)
        set({ profile: parsed })
      } catch {
        // T-002: localStorage 読み取り失敗時はデフォルト
        set({ profile: { ...DEFAULT_PROFILE } })
      }
    },
  }),
)
