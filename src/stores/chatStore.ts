import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ChatMessage } from '../types/chat'
import { useWorkoutSessionStore } from './workoutSessionStore'
import { storeBus } from './storeBus'

type ChatState = {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  lastFailedInput: string | null
}

type ChatActions = {
  addMessage: (message: ChatMessage) => void
  removeMessage: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setLastFailedInput: (input: string | null) => void
  clearMessages: () => void
  consumeAction: (messageId: string, actionId: string) => void
}

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      error: null,
      lastFailedInput: null,

      addMessage: (message) => {
        set((state) => ({ messages: [...state.messages, message] }))
      },

      removeMessage: (id) => {
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== id),
        }))
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },

      setLastFailedInput: (input) => {
        set({ lastFailedInput: input })
      },

      clearMessages: () => {
        set({
          messages: [],
          isLoading: false,
          error: null,
          lastFailedInput: null,
        })
      },

      consumeAction: (messageId, actionId) => {
        set((state) => {
          const idx = state.messages.findIndex((m) => m.id === messageId)
          if (idx === -1) return state
          if (state.messages[idx].consumedActionId === actionId) return state
          const updated = [...state.messages]
          updated[idx] = { ...updated[idx], consumedActionId: actionId }
          return { messages: updated }
        })
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
