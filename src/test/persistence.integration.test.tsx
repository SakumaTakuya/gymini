import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../stores/settingsStore'

describe('Settings Store Persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({ apiKey: '', hasApiKey: false })
  })

  it('persists API key to localStorage', () => {
    useSettingsStore.getState().setApiKey('test-api-key')

    const stored = localStorage.getItem('gymini:settings')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.state.apiKey).toBe('test-api-key')
    expect(parsed.state.hasApiKey).toBe(true)
  })

  it('restores API key from localStorage', () => {
    localStorage.setItem(
      'gymini:settings',
      JSON.stringify({
        state: { apiKey: 'restored-key', hasApiKey: true },
        version: 0,
      }),
    )

    // Re-create the store to trigger rehydration
    useSettingsStore.persist.rehydrate()

    expect(useSettingsStore.getState().apiKey).toBe('restored-key')
    expect(useSettingsStore.getState().hasApiKey).toBe(true)
  })

  it('falls back to defaults on invalid localStorage data', () => {
    localStorage.setItem('gymini:settings', 'invalid json')
    useSettingsStore.persist.rehydrate()

    // Should not crash, store should still be functional
    expect(useSettingsStore.getState()).toBeDefined()
  })
})
