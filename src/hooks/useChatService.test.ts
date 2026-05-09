import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useChatService } from './useChatService'
import { EMPTY_RESPONSE_FALLBACK } from '../lib/chat/conversation'
import { useChatStore } from '../stores/chatStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import * as ExerciseRepository from '../lib/exerciseRepository'
import * as WorkoutRepository from '../lib/workoutRepository'
import type { GeminiChatResponse, GeminiClient } from '../lib/geminiClient'
import { makeDraftExercise } from '../test/fixtures/draftExercise'

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

  test('API キーがない場合 sendMessage を拒否する', async () => {
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

  test('シンプルなレスポンス時にユーザーとアシスタントのテキストメッセージを追加する', async () => {
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

  test('モデルが空テキストかつツール呼び出しなしで返したときフォールバックを代入する', async () => {
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

  test('空白のみのテキストが返されたときフォールバックを代入する', async () => {
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

  test('read ツールのフォローアップが空テキストを返したときフォールバックを代入する', async () => {
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

  test('read ツールのフォローアップが write 呼び出しを返す場合: pending action を作成する', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    vi.mocked(ExerciseRepository.getAll).mockReturnValue([
      { id: 'ex-1', name: 'ベンチプレス' },
    ])
    const client = mockClient([
      {
        text: null,
        functionCalls: [{ name: 'getExercises', args: {} }],
      },
      {
        text: null,
        functionCalls: [
          {
            name: 'saveWorkout',
            args: {
              date: '2026-04-30',
              exercises: [
                {
                  exerciseName: 'ベンチプレス',
                  sets: [{ weight: 60, reps: 10 }],
                },
              ],
            },
          },
        ],
      },
    ])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('今日ベンチプレス60kg10回3セットやった')
    })
    const msgs = useChatStore.getState().messages
    const last = msgs[msgs.length - 1]
    expect(last.pendingAction).toMatchObject({
      type: 'saveWorkout',
      status: 'pending',
    })
    expect(last.content).not.toBe(EMPTY_RESPONSE_FALLBACK)
    expect(client.generate).toHaveBeenCalledTimes(2)
  })

  test('read ツールのフォローアップがテキスト付き write 呼び出しを返す場合: テキストをコンテンツとして使用する', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    vi.mocked(ExerciseRepository.getAll).mockReturnValue([
      { id: 'ex-1', name: 'ベンチプレス' },
    ])
    const client = mockClient([
      {
        text: null,
        functionCalls: [{ name: 'getExercises', args: {} }],
      },
      {
        text: '記録しますか？',
        functionCalls: [
          {
            name: 'saveWorkout',
            args: {
              date: '2026-04-30',
              exercises: [
                {
                  exerciseName: 'ベンチプレス',
                  sets: [{ weight: 60, reps: 10 }],
                },
              ],
            },
          },
        ],
      },
    ])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('今日ベンチプレス60kg10回3セットやった')
    })
    const msgs = useChatStore.getState().messages
    const last = msgs[msgs.length - 1]
    expect(last.content).toBe('記録しますか？')
    expect(last.pendingAction).toMatchObject({
      type: 'saveWorkout',
      status: 'pending',
    })
  })

  test('read ツールを実行してフォローアップリクエストを送信する', async () => {
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

  test('write ツールに対して実行せず pending action を作成する', async () => {
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

  test('approve が write ツールを実行して結果メッセージを追加する', async () => {
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

  test('approve(id, editedData) で editedData の値が executeWriteTool に渡る (saveWorkout)', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useWorkoutSessionStore.getState().startSession()
    vi.mocked(ExerciseRepository.getAll).mockReturnValue([
      { id: 'ex-1', name: 'ベンチプレス' },
    ])
    const client = mockClient([
      {
        text: '記録しますか？',
        functionCalls: [
          {
            name: 'saveWorkout',
            args: {
              date: '2026-05-04',
              exercises: [
                {
                  exerciseName: 'ベンチプレス',
                  sets: [{ weight: 60, reps: 10 }],
                },
              ],
            },
          },
        ],
      },
    ])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('今日ベンチプレス60kg10回1セット')
    })
    const pendingMessageId = useChatStore
      .getState()
      .messages.find((m) => m.pendingAction?.type === 'saveWorkout')!.id

    await act(async () => {
      await result.current.approve(pendingMessageId, {
        actionType: 'saveWorkout',
        date: '2026-05-04' as never,
        exercises: [
          {
            exerciseName: 'ベンチプレス',
            sets: [{ weight: 65, reps: 10 }],
          },
        ],
      })
    })

    const state = useWorkoutSessionStore.getState()
    expect(state.draftExercises).toHaveLength(1)
    expect(state.draftExercises[0].sets).toEqual([{ weight: 65, reps: 10 }])
  })

  test('approve(id) で editedData 未指定時は元の pendingAction.data がそのまま使われる（後方互換）', async () => {
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
    expect(ExerciseRepository.create).toHaveBeenCalledWith('スクワット')
  })

  test('セッションがアクティブな場合、createClient に渡す systemInstruction にセッション文脈を注入する', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useWorkoutSessionStore.setState({
      isActive: true,
      startedAt: '2026-05-04T19:00:00+09:00' as never,
      date: '2026-05-04' as never,
      draftExercises: [
        makeDraftExercise({ sets: [{ weight: 60, reps: 10 }] }),
      ],
    })
    const createClientMock = vi.fn(
      (_apiKey: string, _systemInstruction?: string) =>
        mockClient([{ text: 'ok', functionCalls: null }]),
    )
    const { result } = renderHook(() =>
      useChatService({ createClient: createClientMock }),
    )
    await act(async () => {
      await result.current.sendMessage('次セット何kg？')
    })
    expect(createClientMock).toHaveBeenCalled()
    const lastCall = createClientMock.mock.calls[0]
    const systemInstruction = lastCall[1] as string
    expect(systemInstruction).toContain('進行中のセッション')
    expect(systemInstruction).toContain('ベンチプレス')
  })

  test('セッションが非アクティブの場合、systemInstruction にセッション文脈を含めない', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    const createClientMock = vi.fn(
      (_apiKey: string, _systemInstruction?: string) =>
        mockClient([{ text: 'ok', functionCalls: null }]),
    )
    const { result } = renderHook(() =>
      useChatService({ createClient: createClientMock }),
    )
    await act(async () => {
      await result.current.sendMessage('hi')
    })
    expect(createClientMock).toHaveBeenCalled()
    const lastCall = createClientMock.mock.calls[0]
    const systemInstruction = lastCall[1] as string
    expect(systemInstruction).not.toContain('進行中のセッション')
  })

  test('approve(id, editedData) で addExerciseToSession に sets を渡せる', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useWorkoutSessionStore.getState().startSession()
    const client = mockClient([
      {
        text: 'ベンチプレスを追加しますか？',
        functionCalls: [
          {
            name: 'addExerciseToSession',
            args: {
              exerciseId: 'ex-1',
              exerciseName: 'ベンチプレス',
              sets: [{ weight: 60, reps: 10 }],
            },
          },
        ],
      },
    ])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('ベンチプレス追加して')
    })
    const pendingMessageId = useChatStore
      .getState()
      .messages.find((m) => m.pendingAction?.type === 'addExerciseToSession')!.id

    await act(async () => {
      await result.current.approve(pendingMessageId, {
        actionType: 'addExerciseToSession',
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
        sets: [
          { weight: 62.5, reps: 10 },
          { weight: 62.5, reps: 10 },
        ],
      })
    })

    const state = useWorkoutSessionStore.getState()
    expect(state.draftExercises).toHaveLength(1)
    expect(state.draftExercises[0].sets).toEqual([
      { weight: 62.5, reps: 10 },
      { weight: 62.5, reps: 10 },
    ])
  })

  test('reject がステータスをマークしてキャンセルメッセージを追加する', async () => {
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

  test('新しい write ツールが来たとき前の pending を自動キャンセルする', async () => {
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

  test('stopResponse が現在のリクエストを中断してローディングをクリアする', async () => {
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

  test('API 呼び出しが非中断エラーをスローしたときエラーメッセージを設定する', async () => {
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

  test('clearMessages がチャットストアをリセットする', async () => {
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

  test('空の入力を無視する', async () => {
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

  test('連続するアシスタントメッセージをマージし履歴送信時に先頭の model ターンを除外する', async () => {
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

  describe('placeholder sets による proposal (FR_015)', () => {
    test('addExerciseToSession に sets:[{0,0}] が来たとき pendingAction.data.sets が保持される', async () => {
      useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
      useWorkoutSessionStore.getState().startSession()
      const client = mockClient([
        {
          text: 'ナイス💪 重量と回数を入力してください',
          functionCalls: [
            {
              name: 'addExerciseToSession',
              args: {
                exerciseId: 'ex-dp',
                exerciseName: 'ダンベルプレス',
                sets: [{ weight: 0, reps: 0 }],
              },
            },
          ],
        },
      ])
      const { result } = renderHook(() =>
        useChatService({ createClient: () => client }),
      )
      await act(async () => {
        await result.current.sendMessage('ダンベルプレスやる')
      })
      const msgs = useChatStore.getState().messages
      const last = msgs[msgs.length - 1]
      expect(last.pendingAction).toMatchObject({
        type: 'addExerciseToSession',
        status: 'pending',
        data: {
          actionType: 'addExerciseToSession',
          exerciseId: 'ex-dp',
          exerciseName: 'ダンベルプレス',
          sets: [{ weight: 0, reps: 0 }],
        },
      })
    })

    test('saveWorkout に sets:[{0,0}] が来たとき pendingAction.data.exercises[].sets が保持される', async () => {
      useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
      const client = mockClient([
        {
          text: 'ナイス💪 重量と回数を入力してください',
          functionCalls: [
            {
              name: 'saveWorkout',
              args: {
                date: '2026-05-05',
                exercises: [
                  {
                    exerciseName: 'ダンベルプレス',
                    sets: [{ weight: 0, reps: 0 }],
                  },
                ],
              },
            },
          ],
        },
      ])
      const { result } = renderHook(() =>
        useChatService({ createClient: () => client }),
      )
      await act(async () => {
        await result.current.sendMessage('胸の日でダンベルプレスやる')
      })
      const msgs = useChatStore.getState().messages
      const last = msgs[msgs.length - 1]
      expect(last.pendingAction).toMatchObject({
        type: 'saveWorkout',
        status: 'pending',
        data: {
          actionType: 'saveWorkout',
          date: '2026-05-05',
          exercises: [
            {
              exerciseName: 'ダンベルプレス',
              sets: [{ weight: 0, reps: 0 }],
            },
          ],
        },
      })
    })
  })

  describe('addExerciseAndLog（新種目を即記録開始）', () => {
    test('Gemini が addExerciseAndLog を呼ぶと pendingAction に sets 既定値が入る', async () => {
      useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
      const client = mockClient([
        {
          text: 'ナイス💪 重量と回数を入力してください',
          functionCalls: [
            {
              name: 'addExerciseAndLog',
              args: { name: 'ラットプルダウン' },
            },
          ],
        },
      ])
      const { result } = renderHook(() =>
        useChatService({ createClient: () => client }),
      )
      await act(async () => {
        await result.current.sendMessage('背中の日。ラットプルダウンやる')
      })
      const msgs = useChatStore.getState().messages
      const last = msgs[msgs.length - 1]
      expect(last.pendingAction).toMatchObject({
        type: 'addExerciseAndLog',
        status: 'pending',
        data: {
          actionType: 'addExerciseAndLog',
          name: 'ラットプルダウン',
          sets: [{ weight: 0, reps: 0 }],
        },
      })
      expect(last.pendingAction?.description).toMatch(
        /種目マスターに追加して、記録を始めますか？/,
      )
      expect(ExerciseRepository.create).not.toHaveBeenCalled()
    })

    test('approve(id, editedData) で編集された sets が executor に渡り、種目作成 + セッション開始まで一括で実行される', async () => {
      useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
      vi.mocked(ExerciseRepository.create).mockReturnValue({
        id: 'ex-lat',
        name: 'ラットプルダウン',
      })
      const client = mockClient([
        {
          text: 'ナイス💪',
          functionCalls: [
            {
              name: 'addExerciseAndLog',
              args: {
                name: 'ラットプルダウン',
                sets: [{ weight: 0, reps: 0 }],
              },
            },
          ],
        },
      ])
      const { result } = renderHook(() =>
        useChatService({ createClient: () => client }),
      )
      await act(async () => {
        await result.current.sendMessage('ラットプルダウンやる')
      })
      const pendingMessageId = useChatStore
        .getState()
        .messages.find((m) => m.pendingAction?.type === 'addExerciseAndLog')!.id

      await act(async () => {
        await result.current.approve(pendingMessageId, {
          actionType: 'addExerciseAndLog',
          name: 'ラットプルダウン',
          sets: [{ weight: 50, reps: 10 }],
        })
      })

      expect(ExerciseRepository.create).toHaveBeenCalledTimes(1)
      expect(ExerciseRepository.create).toHaveBeenCalledWith('ラットプルダウン')
      const session = useWorkoutSessionStore.getState()
      expect(session.isActive).toBe(true)
      expect(session.draftExercises).toHaveLength(1)
      expect(session.draftExercises[0].sets).toEqual([{ weight: 50, reps: 10 }])
      const lastMsg = useChatStore.getState().messages.slice(-1)[0]
      expect(lastMsg.content).toMatch(/記録を始めました/)
    })

    test('reject すると ExerciseRepository.create も呼ばれずセッションも変化しない', async () => {
      useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
      const client = mockClient([
        {
          text: '追加しますか？',
          functionCalls: [
            { name: 'addExerciseAndLog', args: { name: 'ラットプルダウン' } },
          ],
        },
      ])
      const { result } = renderHook(() =>
        useChatService({ createClient: () => client }),
      )
      await act(async () => {
        await result.current.sendMessage('ラットプルダウンやる')
      })
      const pendingMessageId = useChatStore
        .getState()
        .messages.find((m) => m.pendingAction?.type === 'addExerciseAndLog')!.id

      act(() => {
        result.current.reject(pendingMessageId)
      })

      expect(ExerciseRepository.create).not.toHaveBeenCalled()
      const session = useWorkoutSessionStore.getState()
      expect(session.isActive).toBe(false)
      expect(session.draftExercises).toHaveLength(0)
    })

    test('既に登録済みの場合 DUPLICATE_EXERCISE のヒント文言を返す', async () => {
      useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
      vi.mocked(ExerciseRepository.create).mockImplementation(() => {
        throw new Error('Duplicate name: ベンチプレス')
      })
      const client = mockClient([
        {
          text: '追加しますか？',
          functionCalls: [
            { name: 'addExerciseAndLog', args: { name: 'ベンチプレス' } },
          ],
        },
      ])
      const { result } = renderHook(() =>
        useChatService({ createClient: () => client }),
      )
      await act(async () => {
        await result.current.sendMessage('ベンチプレスやる')
      })
      const pendingMessageId = useChatStore
        .getState()
        .messages.find((m) => m.pendingAction?.type === 'addExerciseAndLog')!.id

      await act(async () => {
        await result.current.approve(pendingMessageId)
      })

      const lastMsg = useChatStore.getState().messages.slice(-1)[0]
      expect(lastMsg.content).toMatch(/既に種目マスターに登録/)
      expect(lastMsg.content).toMatch(/ベンチプレス/)
      const session = useWorkoutSessionStore.getState()
      expect(session.isActive).toBe(false)
    })
  })

  describe('EMPTY_RESPONSE_FALLBACK 文言（FR_015 補完）', () => {
    test('エラー風表現を含まず、励まし＋入力例を含むコーチ風文言である', () => {
      expect(EMPTY_RESPONSE_FALLBACK).not.toMatch(/うまく応答を生成できませんでした/)
      expect(EMPTY_RESPONSE_FALLBACK).toMatch(/ナイス|💪|記録/)
      expect(EMPTY_RESPONSE_FALLBACK).toMatch(/例/)
    })
  })

  test('ユーザーターン間のアシスタントメッセージを単一の model ターンにマージする', async () => {
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
