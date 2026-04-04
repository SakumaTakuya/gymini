import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from '@testing-library/react'
import useWorkoutStore from '../stores/workoutStore'
import TrainingPage from './TrainingPage'

beforeEach(() => {
  localStorage.clear()
  act(() => {
    useWorkoutStore.setState({
      workouts: [],
      draftDate: '',
      draftExercises: [],
      draftMemo: '',
      draftWorkoutId: null,
    })
  })
})

const EXERCISE_KEY = 'gymini:exercises'

describe('TrainingPage', () => {
  it('shows IdleView when session is not active', () => {
    render(<TrainingPage />)
    expect(screen.getByRole('button', { name: /トレーニングを開始/i })).toBeInTheDocument()
  })

  it('shows ActiveSessionView when session is active', () => {
    act(() => useWorkoutStore.getState().startSession('2026-03-29'))
    render(<TrainingPage />)
    expect(screen.queryByRole('button', { name: /トレーニングを開始/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /保存/i })).toBeInTheDocument()
  })

  it('starts session when start button is clicked', async () => {
    render(<TrainingPage />)
    await userEvent.click(screen.getByRole('button', { name: /トレーニングを開始/i }))
    expect(useWorkoutStore.getState().draftDate).not.toBe('')
  })

  it('cancels session when cancel is clicked in active view', async () => {
    act(() => useWorkoutStore.getState().startSession('2026-03-29'))
    render(<TrainingPage />)
    await userEvent.click(screen.getByRole('button', { name: /キャンセル/i }))
    expect(useWorkoutStore.getState().draftDate).toBe('')
  })

  it('shows auto-register option when search has no results (FR-006)', async () => {
    localStorage.setItem(EXERCISE_KEY, JSON.stringify([
      { id: 'bench-press', name: 'ベンチプレス' },
    ]))
    act(() => useWorkoutStore.getState().startSession('2026-03-29'))
    render(<TrainingPage />)
    const input = screen.getByPlaceholderText('種目を検索...')
    await userEvent.type(input, 'デッドリフト')
    expect(screen.getByText(/「デッドリフト」を新しい種目として追加/)).toBeInTheDocument()
  })

  it('auto-registers exercise and adds to session on click (FR-006)', async () => {
    localStorage.setItem(EXERCISE_KEY, JSON.stringify([
      { id: 'bench-press', name: 'ベンチプレス' },
    ]))
    act(() => useWorkoutStore.getState().startSession('2026-03-29'))
    render(<TrainingPage />)
    const input = screen.getByPlaceholderText('種目を検索...')
    await userEvent.type(input, 'デッドリフト')
    await userEvent.click(screen.getByText(/「デッドリフト」を新しい種目として追加/))
    // Exercise should be added to the session
    expect(useWorkoutStore.getState().draftExercises).toHaveLength(1)
    expect(useWorkoutStore.getState().draftExercises[0].exerciseName).toBe('デッドリフト')
    // Search should be cleared
    expect(input).toHaveValue('')
  })
})
