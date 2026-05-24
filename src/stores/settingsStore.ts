import { create } from 'zustand'
import { safeGetItem, safeSetItem, safeRemoveItem } from '../lib/storage'

const STORAGE_KEY = 'gymini:api-key'

type SettingsState = {
  apiKey: string
  hasApiKey: boolean
}

type SettingsActions = {
  setApiKey: (key: string) => void
  deleteApiKey: () => void
  loadApiKey: () => void
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  (set) => ({
    apiKey: '',
    hasApiKey: false,

    setApiKey: (key: string) => {
      if (key === '') {
        // 空文字列は「削除」として扱い、localStorage と状態をリセットする
        safeRemoveItem(STORAGE_KEY)
        set({ apiKey: '', hasApiKey: false })
        return
      }
      // T-002: 書き込み失敗時も状態は更新する（失敗は storage エラー信号で通知される）
      safeSetItem(STORAGE_KEY, key)
      set({ apiKey: key, hasApiKey: true })
    },

    deleteApiKey: () => {
      safeRemoveItem(STORAGE_KEY)
      set({ apiKey: '', hasApiKey: false })
    },

    loadApiKey: () => {
      const key = safeGetItem(STORAGE_KEY) ?? ''
      set({ apiKey: key, hasApiKey: key !== '' })
    },
  }),
)
