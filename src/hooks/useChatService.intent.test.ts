import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useChatService } from './useChatService'
import { useChatStore } from '../stores/chatStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import * as ExerciseRepository from '../lib/exerciseRepository'
import * as WorkoutRepository from '../lib/workoutRepository'
import type { GeminiChatResponse, GeminiClient } from '../lib/geminiClient'
import type {
  ClassificationResult,
  IntentClassifier,
  IntentLabel,
} from '../lib/intent/intentClassifier'
import {
  readIntentFeedback,
  resetRoutedRecordTracking,
} from '../lib/intent/feedbackLog'
import {
  ADVICE_KEYLESS_MESSAGE,
  OTHER_KEYLESS_MESSAGE,
  RECORD_NAME_MISSING_MESSAGE,
} from '../lib/intent/intentResponses'

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

function stubClassifier(result: Partial<ClassificationResult>): IntentClassifier {
  return {
    ready: vi.fn(async () => true),
    classify: vi.fn(
      async (): Promise<ClassificationResult> => ({
        scores: { record: 0, history: 0, advice: 0, edit: 0, other: 0 },
        decided: [],
        candidates: [],
        ...result,
      }),
    ),
  }
}

function classifierFor(decided: IntentLabel[]): IntentClassifier {
  return stubClassifier({ decided })
}

function resetStores() {
  useChatStore.setState({
    messages: [],
    isLoading: false,
    error: null,
    lastFailedInput: null,
  })
  useSettingsStore.setState({ apiKey: '', hasApiKey: false })
  useWorkoutSessionStore.setState({
    isActive: false,
    startedAt: null,
    date: null,
    draftExercises: [],
  })
}

function lastMessage() {
  const msgs = useChatStore.getState().messages
  return msgs[msgs.length - 1]
}

describe('useChatService: ローカル意図ルーティング (Phase 5)', () => {
  beforeEach(() => {
    resetStores()
    resetRoutedRecordTracking()
    localStorage.clear()
    vi.resetAllMocks()
    vi.mocked(ExerciseRepository.getAll).mockReturnValue([
      { id: 'ex-bench', name: 'ベンチプレス', category: 'unassigned' },
      { id: 'ex-squat', name: 'スクワット', category: 'unassigned' },
    ])
    vi.mocked(WorkoutRepository.listByDateDesc).mockReturnValue([])
  })

  test('キーなし + record 確定で draft へ即時挿入し LLM を呼ばない', async () => {
    useWorkoutSessionStore.getState().startSession()
    const client = mockClient([])
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => client,
        classifier: classifierFor(['record']),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('ベンチプレス60kg10回×3')
    })
    const session = useWorkoutSessionStore.getState()
    expect(session.draftExercises).toHaveLength(1)
    expect(session.draftExercises[0].exerciseName).toBe('ベンチプレス')
    expect(session.draftExercises[0].sets).toEqual([
      { weight: 60, reps: 10 },
      { weight: 60, reps: 10 },
      { weight: 60, reps: 10 },
    ])
    expect(client.generate).not.toHaveBeenCalled()
    const msgs = useChatStore.getState().messages
    expect(msgs[0]).toMatchObject({ role: 'user', content: 'ベンチプレス60kg10回×3' })
    expect(lastMessage().role).toBe('assistant')
    expect(lastMessage().content).toContain('記録しました')
    expect(lastMessage().content).toContain('60kg×10回 ×3セット')
    expect(useChatStore.getState().error).toBeNull()
  })

  test('キーなし + record + セッション非アクティブでは SESSION_NOT_ACTIVE の案内を返す', async () => {
    const client = mockClient([])
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => client,
        classifier: classifierFor(['record']),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('ベンチプレス60kg10回×3')
    })
    expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(0)
    expect(lastMessage().content).toContain('セッションが開始されていません')
    expect(client.generate).not.toHaveBeenCalled()
  })

  test('キーなし + history 確定で端末内の履歴をテキストで返す', async () => {
    vi.mocked(WorkoutRepository.listByDateDesc).mockReturnValue([
      {
        id: 'w1',
        date: '2026-11-08' as never,
        exercises: [
          {
            exerciseId: 'ex-bench',
            exerciseName: 'ベンチプレス',
            sets: [{ weight: 60, reps: 10 }],
          },
        ],
        startedAt: '2026-11-08T10:00:00+09:00' as never,
        endedAt: '2026-11-08T11:00:00+09:00' as never,
        createdAt: '2026-11-08T11:00:00+09:00' as never,
        updatedAt: '2026-11-08T11:00:00+09:00' as never,
      },
    ])
    const client = mockClient([])
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => client,
        classifier: classifierFor(['history']),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('ベンチの前回は？')
    })
    expect(lastMessage().content).toContain('ベンチプレスの直近の記録です')
    expect(lastMessage().content).toContain('60kg×10回')
    expect(client.generate).not.toHaveBeenCalled()
  })

  test('キーなし + advice 確定では設定案内を返し LLM を呼ばない', async () => {
    const client = mockClient([])
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => client,
        classifier: classifierFor(['advice']),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('次は何kgにすべき？')
    })
    expect(lastMessage().content).toBe(ADVICE_KEYLESS_MESSAGE)
    expect(client.generate).not.toHaveBeenCalled()
  })

  test('キーなし + other 確定では定型応答を返す', async () => {
    const client = mockClient([])
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => client,
        classifier: classifierFor(['other']),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('こんにちは')
    })
    expect(lastMessage().content).toBe(OTHER_KEYLESS_MESSAGE)
    expect(client.generate).not.toHaveBeenCalled()
  })

  test('キーあり + advice のみ確定では従来どおり LLM 経路を使う', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    const client = mockClient([{ text: '62.5kgがおすすめです', functionCalls: null }])
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => client,
        classifier: classifierFor(['advice']),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('次は何kgにすべき？')
    })
    expect(client.generate).toHaveBeenCalledTimes(1)
    expect(lastMessage().content).toBe('62.5kgがおすすめです')
  })

  test('未確定では候補チップ付きメッセージを出し、タップで選んだ意図に再ルーティングする', async () => {
    vi.mocked(WorkoutRepository.listByDateDesc).mockReturnValue([
      {
        id: 'w1',
        date: '2026-11-08' as never,
        exercises: [
          {
            exerciseId: 'ex-bench',
            exerciseName: 'ベンチプレス',
            sets: [{ weight: 60, reps: 10 }],
          },
        ],
        startedAt: '2026-11-08T10:00:00+09:00' as never,
        endedAt: '2026-11-08T11:00:00+09:00' as never,
        createdAt: '2026-11-08T11:00:00+09:00' as never,
        updatedAt: '2026-11-08T11:00:00+09:00' as never,
      },
    ])
    const client = mockClient([])
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => client,
        classifier: stubClassifier({
          decided: [],
          candidates: ['record', 'history'],
        }),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('あれ見せて')
    })
    const chipMessage = lastMessage()
    expect(chipMessage.role).toBe('assistant')
    expect(chipMessage.actions).toHaveLength(2)
    expect(chipMessage.actions?.map((a) => a.kind)).toEqual([
      'intent-route',
      'intent-route',
    ])
    expect(client.generate).not.toHaveBeenCalled()

    const historyAction = chipMessage.actions!.find(
      (a) => a.payload?.intent === 'history',
    )!
    await act(async () => {
      await result.current.triggerAction(chipMessage.id, historyAction)
    })
    expect(lastMessage().content).toContain('直近の記録です')
    // チップ選択がフィードバックログに残る (FR_007)
    const feedback = readIntentFeedback()
    expect(
      feedback.some(
        (e) => e.kind === 'chip-choice' && e.chosenIntent === 'history',
      ),
    ).toBe(true)
  })

  test('分類結果がフィードバックログに classified として残る', async () => {
    useWorkoutSessionStore.getState().startSession()
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => mockClient([]),
        classifier: stubClassifier({
          scores: { record: 0.95, history: 0.1, advice: 0.2, edit: 0.05, other: 0.1 },
          decided: ['record'],
        }),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('ベンチプレス60kg10回')
    })
    const feedback = readIntentFeedback()
    expect(feedback).toHaveLength(1)
    expect(feedback[0]).toMatchObject({
      kind: 'classified',
      text: 'ベンチプレス60kg10回',
      decided: ['record'],
    })
  })

  test('キーあり + record+advice では記録を挿入してから LLM にアドバイスを回す', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useWorkoutSessionStore.getState().startSession()
    const client = mockClient([
      { text: '次は62.5kgに挑戦しましょう', functionCalls: null },
    ])
    const createClientMock = vi.fn(
      (_apiKey: string, _systemInstruction?: string) => client,
    )
    const { result } = renderHook(() =>
      useChatService({
        createClient: createClientMock,
        classifier: classifierFor(['record', 'advice']),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('ベンチ70kg8回できた。次は重量上げるべき？')
    })
    expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(1)
    expect(client.generate).toHaveBeenCalledTimes(1)
    expect(lastMessage().content).toBe('次は62.5kgに挑戦しましょう')
    // 再記録を防ぐ注記が systemInstruction に付く
    const instruction = createClientMock.mock.calls[0][1] as string
    expect(instruction).toContain('再度記録せず')
  })

  test('キーあり + record で抽出できない場合は LLM へ抽出を委譲する', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useWorkoutSessionStore.getState().startSession()
    const client = mockClient([{ text: '記録しました', functionCalls: null }])
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => client,
        classifier: classifierFor(['record']),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('よくわからない記録')
    })
    expect(client.generate).toHaveBeenCalledTimes(1)
    expect(lastMessage().content).toBe('記録しました')
  })

  test('キーなし + record で抽出できない場合は種目名の案内を返す', async () => {
    const client = mockClient([])
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => client,
        classifier: classifierFor(['record']),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('よくわからない記録')
    })
    expect(lastMessage().content).toBe(RECORD_NAME_MISSING_MESSAGE)
    expect(client.generate).not.toHaveBeenCalled()
  })

  test('record と other が同時確定したら other は無視して記録だけ処理する', async () => {
    useWorkoutSessionStore.getState().startSession()
    const client = mockClient([])
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => client,
        classifier: classifierFor(['record', 'other']),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('ベンチプレス60kg10回')
    })
    expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(1)
    expect(lastMessage().content).toContain('記録しました')
    expect(client.generate).not.toHaveBeenCalled()
  })

  test('edit 確定で対象を特定できれば通常カードへの誘導文を返す', async () => {
    useWorkoutSessionStore.getState().startSession()
    useWorkoutSessionStore.getState().addExercise({
      exerciseId: 'ex-bench',
      exerciseName: 'ベンチプレス',
    })
    const client = mockClient([])
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => client,
        classifier: classifierFor(['edit']),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('さっきのベンチ70kgの間違い')
    })
    expect(lastMessage().content).toContain('ベンチプレス')
    expect(lastMessage().content).toContain('カード')
    // draft は書き換えない
    expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(1)
    expect(client.generate).not.toHaveBeenCalled()
  })

  test('edit 確定で対象を特定できない場合は対象選択チップを出し、タップで誘導する', async () => {
    useWorkoutSessionStore.getState().startSession()
    useWorkoutSessionStore.getState().addExercise({
      exerciseId: 'ex-bench',
      exerciseName: 'ベンチプレス',
    })
    useWorkoutSessionStore.getState().addExercise({
      exerciseId: 'ex-squat',
      exerciseName: 'スクワット',
    })
    const client = mockClient([])
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => client,
        classifier: classifierFor(['edit']),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('記録を直して')
    })
    const chipMessage = lastMessage()
    expect(chipMessage.actions).toHaveLength(2)
    expect(chipMessage.actions?.every((a) => a.kind === 'edit-target')).toBe(true)

    await act(async () => {
      await result.current.triggerAction(chipMessage.id, chipMessage.actions![0])
    })
    expect(lastMessage().content).toContain('ベンチプレス')
    expect(lastMessage().content).toContain('カード')
  })

  test('分類器が例外を投げたら従来経路にフォールバックする', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    const failingClassifier: IntentClassifier = {
      ready: vi.fn(async () => true),
      classify: vi.fn(async () => {
        throw new Error('classifier exploded')
      }),
    }
    const client = mockClient([{ text: 'こんにちは！', functionCalls: null }])
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => client,
        classifier: failingClassifier,
      }),
    )
    await act(async () => {
      await result.current.sendMessage('やあ')
    })
    expect(client.generate).toHaveBeenCalledTimes(1)
    expect(lastMessage().content).toBe('こんにちは！')
  })

  test('LLM ターン実行中に intent-route チップをタップすると進行中ターンを中断しローカル結果だけが残る', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    const generateMock = vi.fn(
      (_contents: unknown, signal?: AbortSignal) =>
        new Promise<GeminiChatResponse>((_res, rej) => {
          signal?.addEventListener('abort', () => {
            rej(new DOMException('Aborted', 'AbortError'))
          })
        }),
    )
    const client: GeminiClient = { generate: generateMock }
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client, classifier: null }),
    )

    let sendPromise: Promise<void> = Promise.resolve()
    act(() => {
      sendPromise = result.current.sendMessage('やあ')
    })
    await waitFor(() => expect(useChatStore.getState().isLoading).toBe(true))

    // 分類チップのメッセージがある状態で history チップをタップする
    useChatStore.setState({
      messages: [
        ...useChatStore.getState().messages,
        {
          id: 'chips-1',
          role: 'assistant',
          content: 'どの操作か選んでください。',
          timestamp: '2026-11-09T10:00:00+09:00' as never,
          actions: [
            {
              id: 'intent-history',
              label: '履歴を見る',
              kind: 'intent-route' as const,
              payload: { intent: 'history', text: 'あれ見せて' },
            },
          ],
        },
      ],
    })
    const chipMessage = useChatStore
      .getState()
      .messages.find((m) => m.id === 'chips-1')!
    await act(async () => {
      await result.current.triggerAction('chips-1', chipMessage.actions![0])
      await sendPromise
    })

    const msgs = useChatStore.getState().messages
    // 中断された LLM ターンの応答は混入せず、ローカル履歴の結果が最後になる
    expect(msgs[msgs.length - 1].content).toBe('まだ記録がありません。')
    expect(useChatStore.getState().isLoading).toBe(false)
    expect(useChatStore.getState().error).toBeNull()
    expect(
      readIntentFeedback().some((e) => e.kind === 'chip-choice'),
    ).toBe(true)
  })

  test('分類器が未準備（null）ならキーなしでは従来どおり API キーエラーを返す', async () => {
    const client = mockClient([])
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client, classifier: null }),
    )
    await act(async () => {
      await result.current.sendMessage('hi')
    })
    expect(useChatStore.getState().messages).toEqual([])
    expect(useChatStore.getState().error).toMatch(/APIキー/)
    expect(client.generate).not.toHaveBeenCalled()
  })

  test('ルーティングで挿入したカードはセッション終了（保存）では record-removed にならない', async () => {
    useWorkoutSessionStore.getState().startSession()
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => mockClient([]),
        classifier: classifierFor(['record']),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('ベンチプレス60kg10回')
    })
    expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(1)
    await act(async () => {
      useWorkoutSessionStore.getState().endSession()
    })
    const feedback = readIntentFeedback()
    expect(feedback.some((e) => e.kind === 'record-removed')).toBe(false)
  })

  test('ルーティングで挿入したカードを削除するとフィードバックログに record-removed が残る', async () => {
    useWorkoutSessionStore.getState().startSession()
    const { result } = renderHook(() =>
      useChatService({
        createClient: () => mockClient([]),
        classifier: classifierFor(['record']),
      }),
    )
    await act(async () => {
      await result.current.sendMessage('ベンチプレス60kg10回')
    })
    expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(1)
    await act(async () => {
      useWorkoutSessionStore.getState().deleteExercise(0)
    })
    const feedback = readIntentFeedback()
    expect(feedback.some((e) => e.kind === 'record-removed')).toBe(true)
  })

  test('分類の完了を待つ間は busy になり、完了前の2件目の送信は受け付けない', async () => {
    useWorkoutSessionStore.getState().startSession()
    let resolveClassify: ((r: ClassificationResult) => void) | null = null
    const pending = new Promise<ClassificationResult>((res) => {
      resolveClassify = res
    })
    const classifier: IntentClassifier = {
      ready: vi.fn(async () => true),
      classify: vi.fn(() => pending),
    }
    const { result } = renderHook(() =>
      useChatService({ createClient: () => mockClient([]), classifier }),
    )
    let firstSend: Promise<void> | undefined
    let secondSend: Promise<void> | undefined
    act(() => {
      firstSend = result.current.sendMessage('ベンチプレス60kg10回')
    })
    // 分類の await 中もターンが busy としてマークされる
    expect(useChatStore.getState().isLoading).toBe(true)
    act(() => {
      secondSend = result.current.sendMessage('スクワット100kg5回')
    })
    await act(async () => {
      resolveClassify!({
        scores: { record: 0.9, history: 0, advice: 0, edit: 0, other: 0 },
        decided: ['record'],
        candidates: [],
      })
      await firstSend
      await secondSend
    })
    // 1件目だけが送信順どおりに処理され、2件目は割り込まない
    const userMessages = useChatStore
      .getState()
      .messages.filter((m) => m.role === 'user')
    expect(userMessages).toHaveLength(1)
    expect(userMessages[0].content).toBe('ベンチプレス60kg10回')
    expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(1)
    expect(useWorkoutSessionStore.getState().draftExercises[0].exerciseName).toBe(
      'ベンチプレス',
    )
    expect(useChatStore.getState().isLoading).toBe(false)
  })

  test('分類の完了を待つ間にタップした候補チップは処理しない', async () => {
    useWorkoutSessionStore.getState().startSession()
    let resolveClassify: ((r: ClassificationResult) => void) | null = null
    const pending = new Promise<ClassificationResult>((res) => {
      resolveClassify = res
    })
    const classifier: IntentClassifier = {
      ready: vi.fn(async () => true),
      classify: vi.fn(() => pending),
    }
    const { result } = renderHook(() =>
      useChatService({ createClient: () => mockClient([]), classifier }),
    )
    const chipAction = {
      id: 'intent-history',
      label: '履歴を見る',
      kind: 'intent-route' as const,
      payload: { intent: 'history', text: 'ベンチの履歴' },
    }
    useChatStore.setState({
      messages: [
        {
          id: 'chips-1',
          role: 'assistant',
          content: 'どちらのご用件ですか？',
          timestamp: '2026-11-09T00:00:00.000Z' as never,
          actions: [chipAction],
        },
      ],
    })
    let send: Promise<void> | undefined
    act(() => {
      send = result.current.sendMessage('昨日の記録は？')
    })
    await act(async () => {
      await result.current.triggerAction('chips-1', chipAction)
    })
    // 分類中のためチップは消費もルーティングもされない
    expect(
      readIntentFeedback().some((e) => e.kind === 'chip-choice'),
    ).toBe(false)
    expect(useChatStore.getState().messages).toHaveLength(1)
    await act(async () => {
      resolveClassify!({
        scores: { record: 0, history: 0.95, advice: 0, edit: 0, other: 0 },
        decided: ['history'],
        candidates: [],
      })
      await send
    })
    // 元の送信だけが完了する
    expect(lastMessage().content).toBe('まだ記録がありません。')
  })
})
