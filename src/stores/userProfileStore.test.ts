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
    it('saves profile to localStorage and updates store state', () => {
      useUserProfileStore.getState().setProfile({ birthYear: 1990, weightKg: 70 })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored.birthYear).toBe(1990)
      expect(stored.weightKg).toBe(70)
      expect(useUserProfileStore.getState().profile.birthYear).toBe(1990)
      expect(useUserProfileStore.getState().profile.weightKg).toBe(70)
    })

    it('merges patch into existing profile', () => {
      useUserProfileStore.getState().setProfile({ birthYear: 1990 })
      useUserProfileStore.getState().setProfile({ weightKg: 70 })

      const { profile } = useUserProfileStore.getState()
      expect(profile.birthYear).toBe(1990)
      expect(profile.weightKg).toBe(70)
    })

    it('updates state even when localStorage write fails (T-002)', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded')
      })

      useUserProfileStore.getState().setProfile({ heightCm: 175 })

      expect(useUserProfileStore.getState().profile.heightCm).toBe(175)
    })

    it('accepts null to clear a field', () => {
      useUserProfileStore.getState().setProfile({ birthYear: 1990 })
      useUserProfileStore.getState().setProfile({ birthYear: null })

      expect(useUserProfileStore.getState().profile.birthYear).toBeNull()
    })

    it('accepts all training goal values', () => {
      const goals = ['muscle_gain', 'strength', 'fat_loss', 'maintenance', 'performance'] as const
      for (const goal of goals) {
        useUserProfileStore.getState().setProfile({ trainingGoal: goal })
        expect(useUserProfileStore.getState().profile.trainingGoal).toBe(goal)
      }
    })
  })

  // --- clearProfile ---

  describe('clearProfile', () => {
    it('resets all fields to null and removes from localStorage', () => {
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

    it('resets state even when localStorage removal fails (T-002)', () => {
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
    it('loads profile from localStorage', () => {
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

    it('sets default profile when localStorage is empty', () => {
      useUserProfileStore.getState().loadProfile()

      const { profile } = useUserProfileStore.getState()
      expect(profile.birthYear).toBeNull()
      expect(profile.weightKg).toBeNull()
      expect(profile.heightCm).toBeNull()
      expect(profile.trainingGoal).toBeNull()
    })

    it('falls back to defaults when localStorage read fails (T-002)', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      useUserProfileStore.getState().loadProfile()

      expect(useUserProfileStore.getState().profile.birthYear).toBeNull()
    })

    it('falls back invalid field to null via Zod catch (T-002)', () => {
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

    it('is idempotent when called multiple times', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ birthYear: 1990, weightKg: null, heightCm: null, trainingGoal: null }))

      useUserProfileStore.getState().loadProfile()
      useUserProfileStore.getState().loadProfile()

      expect(useUserProfileStore.getState().profile.birthYear).toBe(1990)
    })
  })
})
