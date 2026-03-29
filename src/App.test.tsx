import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from '@testing-library/react'
import useNavigationStore from './stores/navigationStore'
import useWorkoutStore from './stores/workoutStore'
import App from './App'

beforeEach(() => {
  localStorage.clear()
  act(() => {
    useNavigationStore.setState({ currentRoute: 'training' })
    useWorkoutStore.setState({
      workouts: [],
      draftDate: '',
      draftExercises: [],
      draftMemo: '',
      draftWorkoutId: null,
    })
  })
})

describe('App integration (FR-004, FR-008)', () => {
  it('renders Training page by default', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /トレーニングを開始/i })).toBeInTheDocument()
  })

  it('renders History page when History tab clicked', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    expect(screen.getByText(/Coming Soon/i)).toBeInTheDocument()
  })

  it('returns to Training page when Training tab clicked', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    await userEvent.click(screen.getByRole('button', { name: /training/i }))
    expect(screen.getByRole('button', { name: /トレーニングを開始/i })).toBeInTheDocument()
  })

  it('session data is maintained when navigating between tabs', async () => {
    render(<App />)
    // Start a session
    await userEvent.click(screen.getByRole('button', { name: /トレーニングを開始/i }))
    expect(useWorkoutStore.getState().isActive).toBeUndefined() // isActive is on hook not store
    expect(useWorkoutStore.getState().draftDate).not.toBe('')

    // Navigate to history
    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    // Session data should still be in store
    expect(useWorkoutStore.getState().draftDate).not.toBe('')

    // Navigate back to training - should show active session
    await userEvent.click(screen.getByRole('button', { name: /training/i }))
    expect(screen.getByRole('button', { name: /保存/i })).toBeInTheDocument()
  })
})
