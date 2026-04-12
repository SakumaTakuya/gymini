import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSettingsStore } from './settingsStore'

describe('settingsStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({ apiKey: '', hasApiKey: false })
    vi.restoreAllMocks()
  })

  // --- setApiKey (FR-001) ---

  describe('setApiKey', () => {
    it('saves API key to localStorage and updates store state', () => {
      useSettingsStore.getState().setApiKey('AIzaSy-test-key')

      expect(useSettingsStore.getState().apiKey).toBe('AIzaSy-test-key')
      expect(useSettingsStore.getState().hasApiKey).toBe(true)
      expect(localStorage.getItem('gymini:api-key')).toBe('AIzaSy-test-key')
    })

    it('resets store and localStorage when called with empty string', () => {
      localStorage.setItem('gymini:api-key', 'pre-existing')
      useSettingsStore.setState({ apiKey: 'pre-existing', hasApiKey: true })

      useSettingsStore.getState().setApiKey('')

      expect(useSettingsStore.getState().apiKey).toBe('')
      expect(useSettingsStore.getState().hasApiKey).toBe(false)
      expect(localStorage.getItem('gymini:api-key')).toBeNull()
    })

    it('updates store state even when localStorage write fails (NFR-002)', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded')
      })

      useSettingsStore.getState().setApiKey('AIzaSy-test-key')

      expect(useSettingsStore.getState().apiKey).toBe('AIzaSy-test-key')
      expect(useSettingsStore.getState().hasApiKey).toBe(true)
    })
  })

  // --- deleteApiKey (FR-003) ---

  describe('deleteApiKey', () => {
    it('removes API key from localStorage and resets store state', () => {
      localStorage.setItem('gymini:api-key', 'some-key')
      useSettingsStore.setState({ apiKey: 'some-key', hasApiKey: true })

      useSettingsStore.getState().deleteApiKey()

      expect(useSettingsStore.getState().apiKey).toBe('')
      expect(useSettingsStore.getState().hasApiKey).toBe(false)
      expect(localStorage.getItem('gymini:api-key')).toBeNull()
    })

    it('resets store state even when localStorage removal fails (NFR-002)', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      useSettingsStore.setState({ apiKey: 'some-key', hasApiKey: true })
      useSettingsStore.getState().deleteApiKey()

      expect(useSettingsStore.getState().apiKey).toBe('')
      expect(useSettingsStore.getState().hasApiKey).toBe(false)
    })
  })

  // --- loadApiKey (FR-002, FR-006) ---

  describe('loadApiKey', () => {
    it('loads existing API key from localStorage', () => {
      localStorage.setItem('gymini:api-key', 'AIzaSy-stored-key')

      useSettingsStore.getState().loadApiKey()

      expect(useSettingsStore.getState().apiKey).toBe('AIzaSy-stored-key')
      expect(useSettingsStore.getState().hasApiKey).toBe(true)
    })

    it('sets empty defaults when no key exists in localStorage', () => {
      useSettingsStore.getState().loadApiKey()

      expect(useSettingsStore.getState().apiKey).toBe('')
      expect(useSettingsStore.getState().hasApiKey).toBe(false)
    })

    it('falls back to defaults when localStorage read fails (NFR-002)', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      useSettingsStore.getState().loadApiKey()

      expect(useSettingsStore.getState().apiKey).toBe('')
      expect(useSettingsStore.getState().hasApiKey).toBe(false)
    })
  })

  // --- Edge Cases (CHK-503) ---

  describe('edge cases', () => {
    it('overwrites existing key with setApiKey', () => {
      useSettingsStore.getState().setApiKey('first-key')
      useSettingsStore.getState().setApiKey('second-key')

      expect(useSettingsStore.getState().apiKey).toBe('second-key')
      expect(localStorage.getItem('gymini:api-key')).toBe('second-key')
    })

    it('loadApiKey is idempotent when called multiple times', () => {
      localStorage.setItem('gymini:api-key', 'stable-key')

      useSettingsStore.getState().loadApiKey()
      useSettingsStore.getState().loadApiKey()

      expect(useSettingsStore.getState().apiKey).toBe('stable-key')
      expect(useSettingsStore.getState().hasApiKey).toBe(true)
    })
  })

  // --- hasApiKey (FR-004) ---

  describe('hasApiKey', () => {
    it('is true after setApiKey', () => {
      useSettingsStore.getState().setApiKey('key')
      expect(useSettingsStore.getState().hasApiKey).toBe(true)
    })

    it('is false after deleteApiKey', () => {
      useSettingsStore.getState().setApiKey('key')
      useSettingsStore.getState().deleteApiKey()
      expect(useSettingsStore.getState().hasApiKey).toBe(false)
    })

    it('is false when loadApiKey finds no key', () => {
      useSettingsStore.getState().loadApiKey()
      expect(useSettingsStore.getState().hasApiKey).toBe(false)
    })
  })
})
