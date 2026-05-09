import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../stores/settingsStore'
import { useChatStore } from '../stores/chatStore'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import type { ChatMessage } from '../types/chat'
import type { DateString, ISODateTimeString } from '../schemas/date'

describe('設定ストアの永続化', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({ apiKey: '', hasApiKey: false })
  })

  it('API キーをプレーンテキストとして localStorage に永続化する', () => {
    useSettingsStore.getState().setApiKey('test-api-key')

    const stored = localStorage.getItem('gymini:api-key')
    expect(stored).toBe('test-api-key')
  })

  it('loadApiKey で localStorage から API キーを復元する', () => {
    localStorage.setItem('gymini:api-key', 'restored-key')

    useSettingsStore.getState().loadApiKey()

    expect(useSettingsStore.getState().apiKey).toBe('restored-key')
    expect(useSettingsStore.getState().hasApiKey).toBe(true)
  })

  it('localStorage にキーがない場合はデフォルト値にフォールバックする', () => {
    useSettingsStore.getState().loadApiKey()

    expect(useSettingsStore.getState().apiKey).toBe('')
    expect(useSettingsStore.getState().hasApiKey).toBe(false)
  })
})

describe('チャットストアのセッション同期永続化', () => {
  function makeMessage(id = 'msg-1'): ChatMessage {
    return {
      id,
      role: 'user',
      content: 'hello',
      timestamp: '2026-04-18T12:00:00+09:00' as ISODateTimeString,
    }
  }

  beforeEach(() => {
    localStorage.clear()
    useChatStore.setState({ messages: [], isLoading: false, error: null })
    useWorkoutSessionStore.setState({
      isActive: false,
      startedAt: null,
      date: null,
      draftExercises: [],
    })
  })

  it('セッション中の addMessage を localStorage gymini:chat に永続化する', () => {
    useWorkoutSessionStore.getState().startSession()
    useChatStore.getState().addMessage(makeMessage())

    const stored = localStorage.getItem('gymini:chat')
    expect(stored).toBeTruthy()
    const data = JSON.parse(stored!)
    expect(data.state.messages).toHaveLength(1)
  })

  it('セッション非アクティブで addMessage しても messages を永続化しない', () => {
    useChatStore.getState().addMessage(makeMessage())

    const stored = localStorage.getItem('gymini:chat')
    expect(stored).toBeTruthy()
    const data = JSON.parse(stored!)
    expect(data.state.messages).toEqual([])
  })

  it('rehydrate でセッション中の対話が復元される', async () => {
    // リロード後にセッションがアクティブな状態を直接構築する
    // （startSession を呼ぶと storeBus.clearChatMessages が走るため使わない）
    useWorkoutSessionStore.setState({
      isActive: true,
      startedAt: '2026-04-18T12:00:00+09:00' as ISODateTimeString,
      date: '2026-04-18' as DateString,
      draftExercises: [],
    })

    // リロード後に localStorage が保持していた状態を模擬する
    const msg = makeMessage('persist-1')
    localStorage.setItem(
      'gymini:chat',
      JSON.stringify({ state: { messages: [msg] }, version: 1 }),
    )

    await useChatStore.persist.rehydrate()

    expect(useChatStore.getState().messages).toEqual([msg])
  })

  it('endSession 後は localStorage の gymini:chat の messages が空になる', () => {
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    useChatStore.getState().addMessage(makeMessage())
    useWorkoutSessionStore.getState().endSession()

    expect(useChatStore.getState().messages).toEqual([])
    const stored = localStorage.getItem('gymini:chat')
    expect(stored).toBeTruthy()
    const data = JSON.parse(stored!)
    expect(data.state.messages).toEqual([])
  })
})
