import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUserProfileStore } from './userProfileStore'

const STORAGE_KEY = 'gymini:user-profile'

function resetStore() {
  useUserProfileStore.setState({
    profile: { birthYear: null, weightKg: null, heightCm: null, trainingGoal: null },
  })
}

describe('userProfileStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
    vi.restoreAllMocks()
  })

  // --- setProfile ---

  describe('setProfile', () => {
    it('プロフィールを localStorage に保存してストア状態を更新する', () => {
      useUserProfileStore.getState().setProfile({ birthYear: 1990, weightKg: 70 })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored.birthYear).toBe(1990)
      expect(stored.weightKg).toBe(70)
      expect(useUserProfileStore.getState().profile.birthYear).toBe(1990)
      expect(useUserProfileStore.getState().profile.weightKg).toBe(70)
    })

    it('パッチを既存のプロフィールにマージする', () => {
      useUserProfileStore.getState().setProfile({ birthYear: 1990 })
      useUserProfileStore.getState().setProfile({ weightKg: 70 })

      const { profile } = useUserProfileStore.getState()
      expect(profile.birthYear).toBe(1990)
      expect(profile.weightKg).toBe(70)
    })

    it('localStorage への書き込みが失敗しても状態を更新する', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded')
      })

      useUserProfileStore.getState().setProfile({ heightCm: 175 })

      expect(useUserProfileStore.getState().profile.heightCm).toBe(175)
    })

    it('null を受け付けてフィールドをクリアする', () => {
      useUserProfileStore.getState().setProfile({ birthYear: 1990 })
      useUserProfileStore.getState().setProfile({ birthYear: null })

      expect(useUserProfileStore.getState().profile.birthYear).toBeNull()
    })

    it('すべてのトレーニング目標値を受け付ける', () => {
      const goals = ['muscle_gain', 'strength', 'fat_loss', 'maintenance', 'performance'] as const
      for (const goal of goals) {
        useUserProfileStore.getState().setProfile({ trainingGoal: goal })
        expect(useUserProfileStore.getState().profile.trainingGoal).toBe(goal)
      }
    })
  })

  // --- clearProfile ---

  describe('clearProfile', () => {
    it('すべてのフィールドを null にリセットして localStorage から削除する', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ birthYear: 1990, weightKg: 70, heightCm: 175, trainingGoal: 'muscle_gain' }))
      useUserProfileStore.setState({ profile: { birthYear: 1990, weightKg: 70, heightCm: 175, trainingGoal: 'muscle_gain' } })

      useUserProfileStore.getState().clearProfile()

      const { profile } = useUserProfileStore.getState()
      expect(profile.birthYear).toBeNull()
      expect(profile.weightKg).toBeNull()
      expect(profile.heightCm).toBeNull()
      expect(profile.trainingGoal).toBeNull()
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('localStorage の削除が失敗しても状態をリセットする', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })
      useUserProfileStore.setState({ profile: { birthYear: 1990, weightKg: null, heightCm: null, trainingGoal: null } })

      useUserProfileStore.getState().clearProfile()

      expect(useUserProfileStore.getState().profile.birthYear).toBeNull()
    })
  })

  // --- loadProfile ---

  describe('loadProfile', () => {
    it('localStorage からプロフィールを読み込む', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        birthYear: 1985, weightKg: 65, heightCm: 170, trainingGoal: 'fat_loss',
      }))

      useUserProfileStore.getState().loadProfile()

      const { profile } = useUserProfileStore.getState()
      expect(profile.birthYear).toBe(1985)
      expect(profile.weightKg).toBe(65)
      expect(profile.heightCm).toBe(170)
      expect(profile.trainingGoal).toBe('fat_loss')
    })

    it('localStorage が空の場合はデフォルトプロフィールを設定する', () => {
      useUserProfileStore.getState().loadProfile()

      const { profile } = useUserProfileStore.getState()
      expect(profile.birthYear).toBeNull()
      expect(profile.weightKg).toBeNull()
      expect(profile.heightCm).toBeNull()
      expect(profile.trainingGoal).toBeNull()
    })

    it('localStorage の読み込みが失敗したときデフォルト値にフォールバックする', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      useUserProfileStore.getState().loadProfile()

      expect(useUserProfileStore.getState().profile.birthYear).toBeNull()
    })

    it('不正なフィールドは Zod catch によって null にフォールバックする', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        birthYear: 'not-a-number',
        weightKg: -999,
        heightCm: 170,
        trainingGoal: 'unknown_goal',
      }))

      useUserProfileStore.getState().loadProfile()

      const { profile } = useUserProfileStore.getState()
      expect(profile.birthYear).toBeNull()
      expect(profile.weightKg).toBeNull()
      expect(profile.heightCm).toBe(170)
      expect(profile.trainingGoal).toBeNull()
    })

    it('複数回呼ばれても冪等である', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ birthYear: 1990, weightKg: null, heightCm: null, trainingGoal: null }))

      useUserProfileStore.getState().loadProfile()
      useUserProfileStore.getState().loadProfile()

      expect(useUserProfileStore.getState().profile.birthYear).toBe(1990)
    })
  })
})
