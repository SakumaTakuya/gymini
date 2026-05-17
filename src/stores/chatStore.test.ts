import { beforeEach, describe, expect, test } from 'vitest'
import { useChatStore } from './chatStore'
import { useWorkoutSessionStore } from './workoutSessionStore'
import { makeChatMessage as makeMessage } from '../test/fixtures/chatMessage'

describe('chatStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useChatStore.setState({
      messages: [],
      isLoading: false,
      error: null,
      lastFailedInput: null,
    })
    useWorkoutSessionStore.setState({
      isActive: false,
      startedAt: null,
      date: null,
      draftExercises: [],
    })
  })

  test('初期状態が空である', () => {
    const state = useChatStore.getState()
    expect(state.messages).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.lastFailedInput).toBeNull()
  })

  test('addMessage でメッセージが追加される', () => {
    const msg = makeMessage()
    useChatStore.getState().addMessage(msg)
    expect(useChatStore.getState().messages).toEqual([msg])
  })

  test('removeMessage で指定 id のメッセージが除去される', () => {
    const a = makeMessage({ id: 'a' })
    const b = makeMessage({ id: 'b' })
    useChatStore.getState().addMessage(a)
    useChatStore.getState().addMessage(b)
    useChatStore.getState().removeMessage('a')
    expect(useChatStore.getState().messages).toEqual([b])
  })

  test('removeMessage で存在しない id を指定しても何も起こらない', () => {
    const msg = makeMessage({ id: 'a' })
    useChatStore.getState().addMessage(msg)
    useChatStore.getState().removeMessage('does-not-exist')
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

  test('clearMessages で状態がリセットされる', () => {
    useChatStore.getState().addMessage(makeMessage())
    useChatStore.getState().setLoading(true)
    useChatStore.getState().setError('err')
    useChatStore.getState().setLastFailedInput('やあ')
    useChatStore.getState().clearMessages()
    const state = useChatStore.getState()
    expect(state.messages).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.lastFailedInput).toBeNull()
  })

  test('setLastFailedInput で入力テキストが保持される', () => {
    useChatStore.getState().setLastFailedInput('再送したい')
    expect(useChatStore.getState().lastFailedInput).toBe('再送したい')
    useChatStore.getState().setLastFailedInput(null)
    expect(useChatStore.getState().lastFailedInput).toBeNull()
  })

  test('lastFailedInput は永続化されない', () => {
    useWorkoutSessionStore.getState().startSession()
    useChatStore.getState().setLastFailedInput('再送したい')

    const stored = localStorage.getItem('gymini:chat')
    expect(stored).toBeTruthy()
    const data = JSON.parse(stored!)
    expect(data.state.lastFailedInput).toBeUndefined()
  })

  test('セッションアクティブ中に addMessage すると gymini:chat の messages に書き出される', () => {
    useWorkoutSessionStore.getState().startSession()
    const msg = makeMessage()
    useChatStore.getState().addMessage(msg)

    const stored = localStorage.getItem('gymini:chat')
    expect(stored).toBeTruthy()
    const data = JSON.parse(stored!)
    expect(data.state.messages).toHaveLength(1)
    expect(data.state.messages[0].id).toBe(msg.id)
  })

  test('セッション非アクティブで addMessage しても gymini:chat の messages は空配列', () => {
    // startSession を呼ばない（isActive = false）
    useChatStore.getState().addMessage(makeMessage())

    const stored = localStorage.getItem('gymini:chat')
    expect(stored).toBeTruthy()
    const data = JSON.parse(stored!)
    expect(data.state.messages).toEqual([])
  })
})
