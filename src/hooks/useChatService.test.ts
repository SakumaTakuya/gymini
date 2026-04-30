import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { EMPTY_RESPONSE_FALLBACK, useChatService } from './useChatService'
import { useChatStore } from '../stores/chatStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import * as ExerciseRepository from '../lib/exerciseRepository'
import * as WorkoutRepository from '../lib/workoutRepository'
import type { GeminiChatResponse, GeminiClient } from '../lib/geminiClient'

vi.mock('../lib/exerciseRepository')
vi.mock('../lib/workoutRepository')

function mockClient(
  responses: Array<Partial<GeminiChatResponse> | Error>,
): GeminiClient {
  let i = 0
  return {
    generate: vi.fn(async () => {
      const r = responses[i++]
      if (r instanceof Error) throw r
      return {
        text: r.text ?? null,
        functionCalls: r.functionCalls ?? null,
        modelContent: r.modelContent ?? null,
      }
    }),
  }
}

function resetStores() {
  useChatStore.setState({ messages: [], isLoading: false, error: null })
  useSettingsStore.setState({ apiKey: '', hasApiKey: false })
  useWorkoutSessionStore.setState({
    isActive: false,
    startedAt: null,
    date: null,
    draftExercises: [],
  })
}

describe('useChatService', () => {
  beforeEach(() => {
    resetStores()
    vi.resetAllMocks()
  })

  test('rejects sendMessage when API key is missing', async () => {
    const client = mockClient([])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('hi')
    })
    expect(useChatStore.getState().messages).toEqual([])
    expect(useChatStore.getState().error).toMatch(/APIキー/)
    expect(client.generate).not.toHaveBeenCalled()
  })

  test('adds user + assistant text message on simple response', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    const client = mockClient([{ text: 'こんにちは！', functionCalls: null }])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('やあ')
    })
    const msgs = useChatStore.getState().messages
    expect(msgs).toHaveLength(2)
    expect(msgs[0]).toMatchObject({ role: 'user', content: 'やあ' })
    expect(msgs[1]).toMatchObject({ role: 'assistant', content: 'こんにちは！' })
    expect(useChatStore.getState().isLoading).toBe(false)
  })

  test('substitutes fallback when model returns empty text and no tool calls', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    const client = mockClient([{ text: null, functionCalls: null }])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('今日ベンチプレスしようと思う')
    })
    const msgs = useChatStore.getState().messages
    expect(msgs).toHaveLength(2)
    expect(msgs[1]).toMatchObject({
      role: 'assistant',
      content: EMPTY_RESPONSE_FALLBACK,
    })
  })

  test('substitutes fallback when whitespace-only text is returned', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    const client = mockClient([{ text: '   \n  ', functionCalls: null }])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('今日ベンチプレスしようと思う')
    })
    const msgs = useChatStore.getState().messages
    expect(msgs[msgs.length - 1].content).toBe(EMPTY_RESPONSE_FALLBACK)
  })

  test('substitutes fallback when read-tool follow-up returns empty text', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    vi.mocked(WorkoutRepository.listByDateDesc).mockReturnValue([])
    const client = mockClient([
      {
        text: null,
        functionCalls: [{ name: 'getRecentWorkouts', args: { count: 3 } }],
      },
      { text: null, functionCalls: null },
    ])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('最近のトレーニング教えて')
    })
    const msgs = useChatStore.getState().messages
    expect(msgs[msgs.length - 1]).toMatchObject({
      role: 'assistant',
      content: EMPTY_RESPONSE_FALLBACK,
    })
  })

  test('executes read tool and sends follow-up request', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    vi.mocked(WorkoutRepository.listByDateDesc).mockReturnValue([])
    const client = mockClient([
      {
        text: null,
        functionCalls: [{ name: 'getRecentWorkouts', args: { count: 3 } }],
      },
      { text: '直近の記録はありません。', functionCalls: null },
    ])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('最近のトレーニング教えて')
    })
    const msgs = useChatStore.getState().messages
    expect(msgs[msgs.length - 1]).toMatchObject({
      role: 'assistant',
      content: '直近の記録はありません。',
    })
    expect(msgs[msgs.length - 1].toolCalls?.[0]?.toolName).toBe(
      'getRecentWorkouts',
    )
    expect(client.generate).toHaveBeenCalledTimes(2)
  })

  test('creates pending action for write tool without executing', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    vi.mocked(ExerciseRepository.create).mockImplementation(() => {
      throw new Error('should not be called')
    })
    const client = mockClient([
      {
        text: '追加しますか？',
        functionCalls: [{ name: 'addExercise', args: { name: 'ベンチプレス' } }],
      },
    ])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('ベンチプレスを種目に追加して')
    })
    const msgs = useChatStore.getState().messages
    const last = msgs[msgs.length - 1]
    expect(last.pendingAction).toMatchObject({
      type: 'addExercise',
      status: 'pending',
      data: { actionType: 'addExercise', name: 'ベンチプレス' },
    })
    expect(ExerciseRepository.create).not.toHaveBeenCalled()
  })

  test('approve executes write tool and adds result message', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    vi.mocked(ExerciseRepository.create).mockReturnValue({
      id: 'ex-new',
      name: 'スクワット',
    })
    const client = mockClient([
      {
        text: null,
        functionCalls: [{ name: 'addExercise', args: { name: 'スクワット' } }],
      },
    ])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('スクワットを追加して')
    })
    const pendingMessageId = useChatStore
      .getState()
      .messages.find((m) => m.pendingAction?.type === 'addExercise')!.id

    await act(async () => {
      await result.current.approve(pendingMessageId)
    })
    const msgs = useChatStore.getState().messages
    const updated = msgs.find((m) => m.id === pendingMessageId)
    expect(updated?.pendingAction?.status).toBe('approved')
    expect(msgs[msgs.length - 1].content).toMatch(/追加しました/)
    expect(ExerciseRepository.create).toHaveBeenCalledWith('スクワット')
  })

  test('reject marks status and adds cancel message', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    const client = mockClient([
      {
        text: null,
        functionCalls: [{ name: 'addExercise', args: { name: 'デッドリフト' } }],
      },
    ])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('追加')
    })
    const id = useChatStore
      .getState()
      .messages.find((m) => m.pendingAction)!.id
    act(() => {
      result.current.reject(id)
    })
    const msgs = useChatStore.getState().messages
    expect(msgs.find((m) => m.id === id)?.pendingAction?.status).toBe(
      'rejected',
    )
    expect(msgs[msgs.length - 1].content).toBe('キャンセルしました。')
  })

  test('auto-cancels prior pending when new write tool arrives', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    const client = mockClient([
      {
        text: null,
        functionCalls: [{ name: 'addExercise', args: { name: 'A' } }],
      },
      {
        text: null,
        functionCalls: [{ name: 'addExercise', args: { name: 'B' } }],
      },
    ])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('A 追加')
    })
    await act(async () => {
      await result.current.sendMessage('B 追加')
    })
    const msgs = useChatStore.getState().messages
    const pendingMsgs = msgs.filter((m) => m.pendingAction)
    expect(pendingMsgs.length).toBe(2)
    expect(pendingMsgs[0].pendingAction?.status).toBe('rejected')
    expect(pendingMsgs[1].pendingAction?.status).toBe('pending')
  })

  test('stopResponse aborts current request and clears loading', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    let resolve: ((r: GeminiChatResponse) => void) | null = null
    const generateMock = vi.fn(
      (_contents: unknown, signal?: AbortSignal) =>
        new Promise<GeminiChatResponse>((res, rej) => {
          resolve = res
          signal?.addEventListener('abort', () => {
            const err = new DOMException('Aborted', 'AbortError')
            rej(err)
          })
        }),
    )
    const client: GeminiClient = { generate: generateMock }
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )

    let promise: Promise<void> = Promise.resolve()
    act(() => {
      promise = result.current.sendMessage('hi')
    })

    await waitFor(() => expect(useChatStore.getState().isLoading).toBe(true))
    await act(async () => {
      result.current.stopResponse()
      await promise
    })
    expect(useChatStore.getState().isLoading).toBe(false)
    expect(useChatStore.getState().error).toBeNull()
    // keep compiler satisfied
    void resolve
  })

  test('sets error message when API call throws non-abort error', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    const client = mockClient([new Error('HTTP 401 unauthorized')])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('hi')
    })
    expect(useChatStore.getState().error).toMatch(/APIキー/)
    expect(useChatStore.getState().isLoading).toBe(false)
  })

  test('clearMessages resets chat store', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    const client = mockClient([{ text: 'hi', functionCalls: null }])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('hello')
    })
    act(() => result.current.clearMessages())
    expect(useChatStore.getState().messages).toEqual([])
  })

  test('ignores empty input', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    const client = mockClient([])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('   ')
    })
    expect(useChatStore.getState().messages).toEqual([])
    expect(client.generate).not.toHaveBeenCalled()
  })

  test('merges consecutive assistant messages and drops leading model when sending history', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useChatStore.setState({
      messages: [
        {
          id: 'a',
          role: 'assistant',
          content: '最初の挨拶',
          timestamp: '2026-04-19T00:00:00+09:00' as never,
        },
        {
          id: 'b',
          role: 'assistant',
          content: '結果メッセージ',
          timestamp: '2026-04-19T00:00:01+09:00' as never,
        },
      ],
      isLoading: false,
      error: null,
    })
    const client = mockClient([{ text: 'ok', functionCalls: null }])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('hi')
    })
    const generateMock = client.generate as ReturnType<typeof vi.fn>
    const contents = generateMock.mock.calls[0][0] as Array<{
      role: 'user' | 'model'
      parts: Array<{ text?: string }>
    }>
    expect(contents).toEqual([
      { role: 'user', parts: [{ text: 'hi' }] },
    ])
  })

  test('merges assistant messages between user turns into a single model turn', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useChatStore.setState({
      messages: [
        {
          id: 'u1',
          role: 'user',
          content: '記録して',
          timestamp: '2026-04-19T00:00:00+09:00' as never,
        },
        {
          id: 'a1',
          role: 'assistant',
          content: '記録しますか？',
          timestamp: '2026-04-19T00:00:01+09:00' as never,
        },
        {
          id: 'a2',
          role: 'assistant',
          content: '記録しました！',
          timestamp: '2026-04-19T00:00:02+09:00' as never,
        },
      ],
      isLoading: false,
      error: null,
    })
    const client = mockClient([{ text: 'ok', functionCalls: null }])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('次は？')
    })
    const generateMock = client.generate as ReturnType<typeof vi.fn>
    const contents = generateMock.mock.calls[0][0] as Array<{
      role: 'user' | 'model'
      parts: Array<{ text?: string }>
    }>
    expect(contents.map((c) => c.role)).toEqual(['user', 'model', 'user'])
    expect(contents[1].parts[0].text).toContain('記録しますか？')
    expect(contents[1].parts[0].text).toContain('記録しました！')
  })
})
