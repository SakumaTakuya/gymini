import { create } from 'zustand'

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
        throw new Error(
          '空文字列は setApiKey に渡せません。削除には deleteApiKey() を使用してください。',
        )
      }
      try {
        localStorage.setItem(STORAGE_KEY, key)
      } catch {
        // T-002: localStorage 書き込み失敗時も状態は更新する
      }
      set({ apiKey: key, hasApiKey: true })
    },

    deleteApiKey: () => {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // T-002: localStorage 削除失敗時も状態はリセットする
      }
      set({ apiKey: '', hasApiKey: false })
    },

    loadApiKey: () => {
      try {
        const key = localStorage.getItem(STORAGE_KEY) ?? ''
        set({ apiKey: key, hasApiKey: key !== '' })
      } catch {
        // T-002: localStorage 読み取り失敗時はデフォルト
        set({ apiKey: '', hasApiKey: false })
      }
    },
  }),
)
