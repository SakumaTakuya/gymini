import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useChatService } from './useChatService'
import { useChatStore } from '../stores/chatStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import * as ExerciseRepository from '../lib/exerciseRepository'
import * as WorkoutRepository from '../lib/workoutRepository'
import type { GeminiClient } from '../lib/geminiClient'
import type {
  ClassificationResult,
  IntentClassifier,
} from '../lib/intent/intentClassifier'
import { resetRoutedRecordTracking } from '../lib/intent/feedbackLog'

// 分類器プロバイダを差し替え、「ページ読み込み直後でモデル読み込み中」
// という初回送信の状況を再現する。
const warmUpMock = vi.fn()
const getReadyMock = vi.fn<() => IntentClassifier | null>()
const ensureReadyMock = vi.fn<() => Promise<IntentClassifier | null>>()
vi.mock('../lib/intent/intentClassifierProvider', () => ({
  warmUpIntentClassifier: () => warmUpMock(),
  getReadyIntentClassifier: () => getReadyMock(),
  ensureIntentClassifierReady: () => ensureReadyMock(),
}))

vi.mock('../lib/exerciseRepository')
vi.mock('../lib/workoutRepository')

function recordClassifier(): IntentClassifier {
  return {
    ready: vi.fn(async () => true),
    classify: vi.fn(
      async (): Promise<ClassificationResult> => ({
        scores: { record: 1, history: 0, advice: 0, edit: 0, other: 0 },
        decided: ['record'],
        candidates: [],
      }),
    ),
  }
}

function mockClient(): GeminiClient {
  return {
    generate: vi.fn(async () => ({
      text: 'LLM応答',
      functionCalls: null,
      modelContent: null,
    })),
  }
}

describe('useChatService: 分類器のウォームアップと初回送信', () => {
  beforeEach(() => {
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
    resetRoutedRecordTracking()
    localStorage.clear()
    vi.clearAllMocks()
    vi.mocked(ExerciseRepository.getAll).mockReturnValue([
      { id: 'ex-bench', name: 'ベンチプレス', category: 'unassigned' },
    ])
    vi.mocked(WorkoutRepository.listByDateDesc).mockReturnValue([])
    // 読み込み中はまだ使えない
    getReadyMock.mockReturnValue(null)
    ensureReadyMock.mockResolvedValue(null)
  })

  test('マウント時に分類器のウォームアップを開始する', () => {
    renderHook(() => useChatService({ createClient: () => mockClient() }))
    expect(warmUpMock).toHaveBeenCalled()
  })

  test('初回送信はモデル読み込みの完了を待ってローカルルーティングする', async () => {
    ensureReadyMock.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10))
      return recordClassifier()
    })
    useWorkoutSessionStore.getState().startSession()
    const client = mockClient()
    const { result } = renderHook(() =>
      useChatService({ createClient: () => client }),
    )
    await act(async () => {
      await result.current.sendMessage('ベンチプレス60kg10回')
    })
    const session = useWorkoutSessionStore.getState()
    expect(session.draftExercises).toHaveLength(1)
    expect(session.draftExercises[0].exerciseName).toBe('ベンチプレス')
    expect(session.draftExercises[0].sets).toEqual([{ weight: 60, reps: 10 }])
    expect(client.generate).not.toHaveBeenCalled()
    expect(useChatStore.getState().error).toBeNull()
  })
})
