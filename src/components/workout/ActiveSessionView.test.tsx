import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActiveSessionView } from './ActiveSessionView'
import { useWorkoutSessionStore } from '../../stores/workoutSessionStore'
import type { DateString } from '../../schemas/date'
import type { DraftExercise } from '../../schemas/workout'

function resetStore() {
  useWorkoutSessionStore.setState({
    isActive: false,
    startedAt: null,
    date: null,
    draftExercises: [],
  })
}

describe('ActiveSessionView', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
  })

  it('renders exercise search field', () => {
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    render(<ActiveSessionView />)
    expect(screen.getByPlaceholderText('種目を追加...')).toBeInTheDocument()
  })

  it('adds exercise and shows ExerciseCard', () => {
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    // Seed exercise data
    localStorage.setItem(
      'gymini:exercises',
      JSON.stringify([{ id: 'bench', name: 'ベンチプレス' }]),
    )

    render(<ActiveSessionView />)

    // Search and select
    const input = screen.getByPlaceholderText('種目を追加...')
    fireEvent.change(input, { target: { value: 'ベンチ' } })
    fireEvent.click(screen.getByText('ベンチプレス'))

    // ExerciseCard should appear
    expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
  })

  it('does not render session chrome (delegated to TrainingPage/SessionHeader)', () => {
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    render(<ActiveSessionView />)
    expect(screen.queryByRole('button', { name: '終了' })).not.toBeInTheDocument()
    expect(screen.queryByText(/^\d\d:\d\d:\d\d$/)).not.toBeInTheDocument()
  })

  it('covers weight/reps update and completeSet via PendingSetRow interactions', async () => {
    const user = userEvent.setup()
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    useWorkoutSessionStore.getState().addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
    render(<ActiveSessionView />)

    // Exercise starts in recording mode → PendingSetRow is visible
    const [weightInput, repsInput] = screen.getAllByRole('spinbutton')

    // onWeightChange
    await user.clear(weightInput)
    await user.type(weightInput, '60')

    // onRepsChange
    await user.clear(repsInput)
    await user.type(repsInput, '10')

    // onComplete (completeSet)
    await user.click(screen.getByRole('button', { name: '完了' }))

    expect(useWorkoutSessionStore.getState().draftExercises[0].sets).toHaveLength(1)
  })

  it('covers toggleExerciseCard and activateExercise', async () => {
    const user = userEvent.setup()
    const idleExercise: DraftExercise = {
      exerciseId: 'squat',
      exerciseName: 'スクワット',
      sets: [],
      pendingSet: null,
      cardState: 'idle',
      editingSetIndex: null,
    }
    useWorkoutSessionStore.setState({
      isActive: true,
      date: '2026-03-08' as DateString,
      startedAt: '2026-03-08T10:00:00.000Z' as never,
      draftExercises: [idleExercise],
    })
    render(<ActiveSessionView />)

    // onToggle → collapse the card
    await user.click(screen.getByRole('button', { name: 'スクワット' }))
    expect(useWorkoutSessionStore.getState().draftExercises[0].cardState).toBe('collapsed')

    // onToggle again → expand back to idle
    await user.click(screen.getByRole('button', { name: 'スクワット' }))
    expect(useWorkoutSessionStore.getState().draftExercises[0].cardState).toBe('idle')

    // onActivate → activate recording
    await user.click(screen.getByRole('button', { name: '追加' }))
    expect(useWorkoutSessionStore.getState().draftExercises[0].cardState).toBe('recording')
  })

  it('covers deleteExercise via menu', async () => {
    const user = userEvent.setup()
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    useWorkoutSessionStore.getState().addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
    render(<ActiveSessionView />)

    // Open menu
    await user.click(screen.getByRole('button', { name: '種目メニュー' }))
    // Click delete in menu
    await user.click(screen.getByRole('button', { name: /削除/ }))

    expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(0)
  })
})
