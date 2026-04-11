import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../stores/settingsStore'

describe('Settings Store Persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({ apiKey: '', hasApiKey: false })
  })

  it('persists API key to localStorage as plain text', () => {
    useSettingsStore.getState().setApiKey('test-api-key')

    const stored = localStorage.getItem('gymini:api-key')
    expect(stored).toBe('test-api-key')
  })

  it('restores API key from localStorage via loadApiKey', () => {
    localStorage.setItem('gymini:api-key', 'restored-key')

    useSettingsStore.getState().loadApiKey()

    expect(useSettingsStore.getState().apiKey).toBe('restored-key')
    expect(useSettingsStore.getState().hasApiKey).toBe(true)
  })

  it('falls back to defaults when localStorage has no key', () => {
    useSettingsStore.getState().loadApiKey()

    expect(useSettingsStore.getState().apiKey).toBe('')
    expect(useSettingsStore.getState().hasApiKey).toBe(false)
  })
})
