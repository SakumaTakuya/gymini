import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SettingsState = {
  apiKey: string
  hasApiKey: boolean
  setApiKey: (key: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      hasApiKey: false,
      setApiKey: (key: string) => set({ apiKey: key, hasApiKey: key.length > 0 }),
    }),
    {
      name: 'gymini:settings',
    },
  ),
)
