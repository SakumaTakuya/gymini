import { beforeEach, describe, expect, test } from 'vitest'
import { useChatStore } from './chatStore'
import type { ChatMessage, PendingAction } from '../types/chat'
import type { ISODateTimeString } from '../schemas/date'

const NOW = '2026-04-18T12:00:00+09:00' as ISODateTimeString

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: overrides.id ?? 'msg-1',
    role: overrides.role ?? 'user',
    content: overrides.content ?? 'hello',
    timestamp: overrides.timestamp ?? NOW,
    ...overrides,
  }
}

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [], isLoading: false, error: null })
  })

  test('初期状態が空である', () => {
    const state = useChatStore.getState()
    expect(state.messages).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  test('addMessage でメッセージが追加される', () => {
    const msg = makeMessage()
    useChatStore.getState().addMessage(msg)
    expect(useChatStore.getState().messages).toEqual([msg])
  })

  test('setLoading で isLoading が切り替わる', () => {
    useChatStore.getState().setLoading(true)
    expect(useChatStore.getState().isLoading).toBe(true)
    useChatStore.getState().setLoading(false)
    expect(useChatStore.getState().isLoading).toBe(false)
  })

  test('setError でエラーが設定される', () => {
    useChatStore.getState().setError('boom')
    expect(useChatStore.getState().error).toBe('boom')
    useChatStore.getState().setError(null)
    expect(useChatStore.getState().error).toBeNull()
  })

  test('updatePendingAction でメッセージに pendingAction がある場合にステータスが更新される', () => {
    const pendingAction: PendingAction = {
      id: 'pa-1',
      type: 'addExercise',
      description: '追加しますか？',
      data: { actionType: 'addExercise', name: 'ベンチプレス' },
      status: 'pending',
    }
    const msg = makeMessage({
      id: 'm-1',
      role: 'assistant',
      pendingAction,
    })
    useChatStore.getState().addMessage(msg)
    useChatStore.getState().updatePendingAction('m-1', 'approved')
    const updated = useChatStore.getState().messages[0]
    expect(updated.pendingAction?.status).toBe('approved')
  })

  test('updatePendingAction は pendingAction のないメッセージでは何もしない', () => {
    const msg = makeMessage({ id: 'm-1' })
    useChatStore.getState().addMessage(msg)
    useChatStore.getState().updatePendingAction('m-1', 'approved')
    expect(useChatStore.getState().messages[0]).toEqual(msg)
  })

  test('removeMessage で一致する id のメッセージが除外される', () => {
    useChatStore.getState().addMessage(makeMessage({ id: 'a' }))
    useChatStore.getState().addMessage(makeMessage({ id: 'b' }))
    useChatStore.getState().removeMessage('a')
    const ids = useChatStore.getState().messages.map((m) => m.id)
    expect(ids).toEqual(['b'])
  })

  test('clearMessages で状態がリセットされる', () => {
    useChatStore.getState().addMessage(makeMessage())
    useChatStore.getState().setLoading(true)
    useChatStore.getState().setError('err')
    useChatStore.getState().clearMessages()
    const state = useChatStore.getState()
    expect(state.messages).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  test('persist を使用しない（localStorage キーが存在しない）', () => {
    useChatStore.getState().addMessage(makeMessage())
    // chatStore は persist を使わないため、内部的な localStorage キーは存在しない
    const keys = Object.keys(localStorage).filter((k) => k.includes('chat'))
    expect(keys).toEqual([])
  })
})
