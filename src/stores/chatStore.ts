import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ChatMessage, PendingActionStatus } from '../types/chat'
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
  updatePendingAction: (messageId: string, status: PendingActionStatus) => void
  removeMessage: (messageId: string) => void
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

      updatePendingAction: (messageId, status) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId && msg.pendingAction
              ? { ...msg, pendingAction: { ...msg.pendingAction, status } }
              : msg,
          ),
        }))
      },

      removeMessage: (messageId) => {
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== messageId),
        }))
      },

      clearMessages: () => {
        set({ messages: [], isLoading: false, error: null })
      },
    }),
    {
      name: 'gymini:chat',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // セッションアクティブ中のみ messages を永続化する（FR_033 / B-001 残留防止）。
      // 非アクティブ時は明示的に空配列を書き出して、前セッションの残留を上書き消去する。
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

// workoutSessionStore からの呼び出し用に clearMessages を bus に登録する。
// 詳細は docs/adr/ai-chat.md「Store 間の循環 import 回避」を参照。
storeBus.clearChatMessages = () => {
  useChatStore.getState().clearMessages()
}
