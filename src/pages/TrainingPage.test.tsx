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
})
