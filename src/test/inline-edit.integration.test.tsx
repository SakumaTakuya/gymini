import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ChatBubble } from '../components/chat/ChatBubble'
import { ConfirmationBubble } from '../components/chat/ConfirmationBubble'
import { useChatService } from '../hooks/useChatService'
import { useChatStore } from '../stores/chatStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import * as ExerciseRepository from '../lib/exerciseRepository'
import type { GeminiChatResponse, GeminiClient } from '../lib/geminiClient'
import type { ChatMessage } from '../types/chat'

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

function ChatHarness({ client }: { client: GeminiClient }) {
  const { messages, sendMessage, approve, reject } = useChatService({
    createClient: () => client,
  })
  return (
    <div>
      <button
        data-testid="send"
        onClick={() => void sendMessage('ベンチプレス60kg10回3セットで追加')}
      >
        send
      </button>
      {messages.map((m: ChatMessage) =>
        m.pendingAction ? (
          <ConfirmationBubble
            key={m.id}
            content={m.content}
            pendingAction={m.pendingAction}
            onApprove={(edited) => void approve(m.id, edited)}
            onReject={() => reject(m.id)}
          />
        ) : (
          <ChatBubble key={m.id} role={m.role} content={m.content} />
        ),
      )}
    </div>
  )
}

describe('Inline editing of AI proposed sets (FR_013)', () => {
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
  })

  test('AIがaddExerciseToSession(sets付き)を提案 → 重量編集 → 記録 → セッションに反映', async () => {
    useWorkoutSessionStore.getState().startSession()
    vi.mocked(ExerciseRepository.getAll).mockReturnValue([
      { id: 'ex-1', name: 'ベンチプレス' },
    ])

    const client = mockClient([
      {
        text: 'ベンチプレスを以下の内容で追加しますか？値は調整できます',
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

    render(<ChatHarness client={client} />)
    await act(async () => {
      fireEvent.click(screen.getByTestId('send'))
    })

    const inputs = await screen.findAllByRole('spinbutton')
    expect(inputs).toHaveLength(6)

    // 1セット目の重量を 60→62.5 に編集
    await userEvent.clear(inputs[0])
    await userEvent.type(inputs[0], '62.5')

    await userEvent.click(screen.getByRole('button', { name: /追加する/ }))

    const state = useWorkoutSessionStore.getState()
    expect(state.draftExercises).toHaveLength(1)
    expect(state.draftExercises[0].exerciseName).toBe('ベンチプレス')
    expect(state.draftExercises[0].sets).toEqual([
      { weight: 62.5, reps: 10 },
      { weight: 60, reps: 10 },
      { weight: 60, reps: 10 },
    ])
  })
})
