import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TrainingPage } from './TrainingPage'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'

function resetStore() {
  useWorkoutSessionStore.setState({
    isActive: false,
    startedAt: null,
    date: null,
    draftExercises: [],
  })
}

describe('TrainingPage', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
  })

  it('shows IdleView when session is not active', () => {
    render(<TrainingPage />)
    expect(
      screen.getByRole('button', { name: /トレーニングを始める/ }),
    ).toBeInTheDocument()
  })

  it('shows ActiveSessionView when session is active', () => {
    useWorkoutSessionStore.getState().startSession()
    render(<TrainingPage />)
    expect(screen.getByText('ワークアウト')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('種目を追加...')).toBeInTheDocument()
  })

  it('transitions from IdleView to ActiveSessionView on button click', () => {
    render(<TrainingPage />)
    fireEvent.click(
      screen.getByRole('button', { name: /トレーニングを始める/ }),
    )
    expect(screen.getByText('ワークアウト')).toBeInTheDocument()
  })
})
