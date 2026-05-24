import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ActiveSessionView } from '../components/workout/ActiveSessionView'
import { useChatService } from '../hooks/useChatService'
import { useChatStore } from '../stores/chatStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import * as ExerciseRepository from '../lib/exerciseRepository'
import type { GeminiChatResponse, GeminiClient } from '../lib/geminiClient'

vi.mock('../lib/exerciseRepository')

function mockClient(
  responses: Array<Partial<GeminiChatResponse>>,
): GeminiClient {
  let i = 0
  return {
    generate: vi.fn(async () => {
      const r = responses[i++]
      return {
        text: r.text ?? null,
        functionCalls: r.functionCalls ?? null,
        modelContent: r.modelContent ?? null,
      }
    }),
  }
}

function Harness({ client }: { client: GeminiClient }) {
  const { sendMessage } = useChatService({ createClient: () => client })
  return (
    <div>
      <button
        data-testid="send"
        onClick={() => void sendMessage('ベンチプレス60kg10回3セットで追加')}
      >
        send
      </button>
      <ActiveSessionView />
    </div>
  )
}

describe('AI 書き込みの即時カード挿入 (REQ_008 / FR_013)', () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [], isLoading: false, error: null })
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useWorkoutSessionStore.setState({
      isActive: false,
      startedAt: null,
      date: null,
      draftExercises: [],
    })
    vi.resetAllMocks()
    vi.mocked(ExerciseRepository.search).mockReturnValue([])
  })

  test('AI が addExerciseToSession(sets付き) を呼ぶと、承認なしで通常カードが即時挿入される', async () => {
    useWorkoutSessionStore.getState().startSession()

    const client = mockClient([
      {
        text: 'ベンチプレスを追加しました',
        functionCalls: [
          {
            name: 'addExerciseToSession',
            args: {
              exerciseId: 'ex-1',
              exerciseName: 'ベンチプレス',
              sets: [
                { weight: 60, reps: 10 },
                { weight: 60, reps: 10 },
                { weight: 60, reps: 10 },
              ],
            },
          },
        ],
      },
    ])

    render(<Harness client={client} />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('send'))
    })

    // 承認/破棄カードは存在せず、手入力と同じ通常カードが即時反映される
    expect(screen.queryByText(/AI 提案/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /保存/ })).not.toBeInTheDocument()
    expect(await screen.findByText('ベンチプレス')).toBeInTheDocument()

    const state = useWorkoutSessionStore.getState()
    expect(state.draftExercises).toHaveLength(1)
    expect(state.draftExercises[0].exerciseName).toBe('ベンチプレス')
    expect(state.draftExercises[0].cardState).toBe('idle')
    expect(state.draftExercises[0].sets).toEqual([
      { weight: 60, reps: 10 },
      { weight: 60, reps: 10 },
      { weight: 60, reps: 10 },
    ])
  })

  test('種目名のみ (placeholder) のときは recording の空カードが即時挿入される', async () => {
    useWorkoutSessionStore.getState().startSession()

    const client = mockClient([
      {
        text: 'ナイス💪 重量と回数を入力してください',
        functionCalls: [
          {
            name: 'addExerciseToSession',
            args: {
              exerciseId: 'ex-1',
              exerciseName: 'ベンチプレス',
              sets: [{ weight: 0, reps: 0 }],
            },
          },
        ],
      },
    ])

    render(<Harness client={client} />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('send'))
    })

    expect(screen.queryByText(/AI 提案/)).not.toBeInTheDocument()
    expect(await screen.findByText('ベンチプレス')).toBeInTheDocument()

    const state = useWorkoutSessionStore.getState()
    expect(state.draftExercises).toHaveLength(1)
    expect(state.draftExercises[0].sets).toEqual([])
    expect(state.draftExercises[0].cardState).toBe('recording')
    expect(state.draftExercises[0].pendingSet).toEqual({ weight: 0, reps: 0 })
  })
})
