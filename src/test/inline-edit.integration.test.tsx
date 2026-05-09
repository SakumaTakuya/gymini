import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('AI 提案 draft カードでのインライン編集 (FR_013)', () => {
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

  test('AI が addExerciseToSession(sets付き) を提案 → ai-suggested カードで重量編集 → 保存 → 通常 draft に昇格', async () => {
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

    expect(screen.getByText(/AI 提案/)).toBeInTheDocument()
    const inputs = await screen.findAllByRole('spinbutton')
    expect(inputs).toHaveLength(6)

    // 1 セット目の重量を 60 → 62.5 に編集
    await userEvent.clear(inputs[0])
    await userEvent.type(inputs[0], '62.5')

    await userEvent.click(screen.getByRole('button', { name: /保存/ }))

    const state = useWorkoutSessionStore.getState()
    expect(state.draftExercises).toHaveLength(1)
    expect(state.draftExercises[0].exerciseName).toBe('ベンチプレス')
    expect(state.draftExercises[0].origin).toBe('manual')
    expect(state.draftExercises[0].sets).toEqual([
      { weight: 62.5, reps: 10 },
      { weight: 60, reps: 10 },
      { weight: 60, reps: 10 },
    ])
  })
})
