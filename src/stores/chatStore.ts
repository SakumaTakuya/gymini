import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ChatMessage } from '../types/chat'
import { useWorkoutSessionStore } from './workoutSessionStore'
import { storeBus } from './storeBus'

type ChatState = {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
}

type ChatActions = {
  addMessage: (message: ChatMessage) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      error: null,

      addMessage: (message) => {
        set((state) => ({ messages: [...state.messages, message] }))
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },

      clearMessages: () => {
        set({ messages: [], isLoading: false, error: null })
      },
    }),
    {
      name: 'gymini:chat',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // 非アクティブ時は空配列を書き出して、前セッションの残留を上書き消去する。
      partialize: (state) =>
        useWorkoutSessionStore.getState().isActive
          ? { messages: state.messages }
          : { messages: [] },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn(
            '[gymini] chatStore rehydration failed, using defaults',
            error,
          )
        }
      },
    },
  ),
)

storeBus.clearChatMessages = () => {
  useChatStore.getState().clearMessages()
}
