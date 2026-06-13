import { create } from 'zustand'
import { safeGetItem, safeSetItem, safeRemoveItem } from '../lib/storage'
import { DEFAULT_GEMINI_MODEL } from '../lib/geminiModels'

const STORAGE_KEY = 'gymini:api-key'
const MODEL_STORAGE_KEY = 'gymini:gemini-model'

type SettingsState = {
  apiKey: string
  hasApiKey: boolean
  /** 対話に使う Gemini モデル id。未選択時は DEFAULT_GEMINI_MODEL。 */
  model: string
}

type SettingsActions = {
  setApiKey: (key: string) => void
  deleteApiKey: () => void
  loadApiKey: () => void
  setModel: (model: string) => void
  loadModel: () => void
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  (set) => ({
    apiKey: '',
    hasApiKey: false,
    model: DEFAULT_GEMINI_MODEL,

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

    setModel: (model: string) => {
      // APIキーと同じく書き込み失敗時もストア状態は楽観的に更新する
      safeSetItem(MODEL_STORAGE_KEY, model)
      set({ model })
    },

    loadModel: () => {
      const stored = safeGetItem(MODEL_STORAGE_KEY)
      set({ model: stored || DEFAULT_GEMINI_MODEL })
    },
  }),
)
