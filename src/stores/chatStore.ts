import { create } from 'zustand'
import type { ChatMessage, PendingActionStatus } from '../types/chat'

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
  updateMessageContent: (messageId: string, content: string) => void
  removeMessage: (messageId: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState & ChatActions>()((set) => ({
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

  updateMessageContent: (messageId, content) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, content } : msg,
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
}))
