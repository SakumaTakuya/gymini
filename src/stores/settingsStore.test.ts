import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSettingsStore } from './settingsStore'
import { DEFAULT_GEMINI_MODEL } from '../lib/geminiModels'

describe('settingsStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({
      apiKey: '',
      hasApiKey: false,
      model: DEFAULT_GEMINI_MODEL,
    })
    vi.restoreAllMocks()
  })

  describe('setApiKey', () => {
    it('API キーを localStorage に保存してストア状態を更新する', () => {
      useSettingsStore.getState().setApiKey('AIzaSy-test-key')

      expect(useSettingsStore.getState().apiKey).toBe('AIzaSy-test-key')
      expect(useSettingsStore.getState().hasApiKey).toBe(true)
      expect(localStorage.getItem('gymini:api-key')).toBe('AIzaSy-test-key')
    })

    it('空文字で呼ばれたときストアと localStorage をリセットする', () => {
      localStorage.setItem('gymini:api-key', 'pre-existing')
      useSettingsStore.setState({ apiKey: 'pre-existing', hasApiKey: true })

      useSettingsStore.getState().setApiKey('')

      expect(useSettingsStore.getState().apiKey).toBe('')
      expect(useSettingsStore.getState().hasApiKey).toBe(false)
      expect(localStorage.getItem('gymini:api-key')).toBeNull()
    })

    it('localStorage への書き込みが失敗してもストア状態を更新する', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded')
      })

      useSettingsStore.getState().setApiKey('AIzaSy-test-key')

      expect(useSettingsStore.getState().apiKey).toBe('AIzaSy-test-key')
      expect(useSettingsStore.getState().hasApiKey).toBe(true)
    })
  })

  describe('deleteApiKey', () => {
    it('API キーを localStorage から削除してストア状態をリセットする', () => {
      localStorage.setItem('gymini:api-key', 'some-key')
      useSettingsStore.setState({ apiKey: 'some-key', hasApiKey: true })

      useSettingsStore.getState().deleteApiKey()

      expect(useSettingsStore.getState().apiKey).toBe('')
      expect(useSettingsStore.getState().hasApiKey).toBe(false)
      expect(localStorage.getItem('gymini:api-key')).toBeNull()
    })

    it('localStorage の削除が失敗してもストア状態をリセットする', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      useSettingsStore.setState({ apiKey: 'some-key', hasApiKey: true })
      useSettingsStore.getState().deleteApiKey()

      expect(useSettingsStore.getState().apiKey).toBe('')
      expect(useSettingsStore.getState().hasApiKey).toBe(false)
    })
  })

  describe('loadApiKey', () => {
    it('localStorage から既存の API キーを読み込む', () => {
      localStorage.setItem('gymini:api-key', 'AIzaSy-stored-key')

      useSettingsStore.getState().loadApiKey()

      expect(useSettingsStore.getState().apiKey).toBe('AIzaSy-stored-key')
      expect(useSettingsStore.getState().hasApiKey).toBe(true)
    })

    it('localStorage にキーが存在しない場合は空のデフォルト値を設定する', () => {
      useSettingsStore.getState().loadApiKey()

      expect(useSettingsStore.getState().apiKey).toBe('')
      expect(useSettingsStore.getState().hasApiKey).toBe(false)
    })

    it('localStorage の読み込みが失敗したときデフォルト値にフォールバックする', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      useSettingsStore.getState().loadApiKey()

      expect(useSettingsStore.getState().apiKey).toBe('')
      expect(useSettingsStore.getState().hasApiKey).toBe(false)
    })
  })

  describe('エッジケース', () => {
    it('setApiKey で既存のキーを上書きする', () => {
      useSettingsStore.getState().setApiKey('first-key')
      useSettingsStore.getState().setApiKey('second-key')

      expect(useSettingsStore.getState().apiKey).toBe('second-key')
      expect(localStorage.getItem('gymini:api-key')).toBe('second-key')
    })

    it('loadApiKey は複数回呼ばれても冪等である', () => {
      localStorage.setItem('gymini:api-key', 'stable-key')

      useSettingsStore.getState().loadApiKey()
      useSettingsStore.getState().loadApiKey()

      expect(useSettingsStore.getState().apiKey).toBe('stable-key')
      expect(useSettingsStore.getState().hasApiKey).toBe(true)
    })
  })

  describe('model', () => {
    it('初期値は DEFAULT_GEMINI_MODEL である', () => {
      expect(useSettingsStore.getState().model).toBe(DEFAULT_GEMINI_MODEL)
    })

    it('setModel がモデルを localStorage に保存してストア状態を更新する', () => {
      useSettingsStore.getState().setModel('gemini-2.5-pro')

      expect(useSettingsStore.getState().model).toBe('gemini-2.5-pro')
      expect(localStorage.getItem('gymini:gemini-model')).toBe('gemini-2.5-pro')
    })

    it('setModel は localStorage 書き込みが失敗してもストア状態を更新する', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded')
      })

      useSettingsStore.getState().setModel('gemini-2.5-pro')

      expect(useSettingsStore.getState().model).toBe('gemini-2.5-pro')
    })

    it('loadModel が localStorage から既存モデルを読み込む', () => {
      localStorage.setItem('gymini:gemini-model', 'gemini-2.5-flash')

      useSettingsStore.getState().loadModel()

      expect(useSettingsStore.getState().model).toBe('gemini-2.5-flash')
    })

    it('loadModel はモデル未保存のとき DEFAULT_GEMINI_MODEL にフォールバックする', () => {
      useSettingsStore.getState().loadModel()

      expect(useSettingsStore.getState().model).toBe(DEFAULT_GEMINI_MODEL)
    })

    it('loadModel は読み込み失敗時に DEFAULT_GEMINI_MODEL にフォールバックする', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      useSettingsStore.getState().loadModel()

      expect(useSettingsStore.getState().model).toBe(DEFAULT_GEMINI_MODEL)
    })
  })

  describe('hasApiKey', () => {
    it('setApiKey の後は true になる', () => {
      useSettingsStore.getState().setApiKey('key')
      expect(useSettingsStore.getState().hasApiKey).toBe(true)
    })

    it('deleteApiKey の後は false になる', () => {
      useSettingsStore.getState().setApiKey('key')
      useSettingsStore.getState().deleteApiKey()
      expect(useSettingsStore.getState().hasApiKey).toBe(false)
    })

    it('loadApiKey がキーを見つけられない場合は false になる', () => {
      useSettingsStore.getState().loadApiKey()
      expect(useSettingsStore.getState().hasApiKey).toBe(false)
    })
  })
})
