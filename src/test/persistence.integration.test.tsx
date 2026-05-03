import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../stores/settingsStore'

describe('設定ストアの永続化', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({ apiKey: '', hasApiKey: false })
  })

  it('API キーをプレーンテキストとして localStorage に永続化する', () => {
    useSettingsStore.getState().setApiKey('test-api-key')

    const stored = localStorage.getItem('gymini:api-key')
    expect(stored).toBe('test-api-key')
  })

  it('loadApiKey で localStorage から API キーを復元する', () => {
    localStorage.setItem('gymini:api-key', 'restored-key')

    useSettingsStore.getState().loadApiKey()

    expect(useSettingsStore.getState().apiKey).toBe('restored-key')
    expect(useSettingsStore.getState().hasApiKey).toBe(true)
  })

  it('localStorage にキーがない場合はデフォルト値にフォールバックする', () => {
    useSettingsStore.getState().loadApiKey()

    expect(useSettingsStore.getState().apiKey).toBe('')
    expect(useSettingsStore.getState().hasApiKey).toBe(false)
  })
})
