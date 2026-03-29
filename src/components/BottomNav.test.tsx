import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from '@testing-library/react'
import useNavigationStore from '../stores/navigationStore'
import useWorkoutStore from '../stores/workoutStore'
import BottomNav from './BottomNav'

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

describe('BottomNav', () => {
  it('renders Training and History tabs', () => {
    render(<BottomNav />)
    expect(screen.getByRole('button', { name: /training/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument()
  })

  it('highlights Training tab when currentRoute=training', () => {
    render(<BottomNav />)
    const trainingBtn = screen.getByRole('button', { name: /training/i })
    expect(trainingBtn.className).toMatch(/text-black|font-bold|active/)
  })

  it('navigate to history when History tab clicked', async () => {
    render(<BottomNav />)
    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    expect(useNavigationStore.getState().currentRoute).toBe('history')
  })

  it('navigate back to training when Training tab clicked', async () => {
    act(() => useNavigationStore.setState({ currentRoute: 'history' }))
    render(<BottomNav />)
    await userEvent.click(screen.getByRole('button', { name: /training/i }))
    expect(useNavigationStore.getState().currentRoute).toBe('training')
  })

  it('FAB is hidden when session is not active', () => {
    const { container } = render(<BottomNav />)
    const fabBtn = container.querySelector('[aria-label="種目を追加"]')
    expect(fabBtn?.className).toMatch(/invisible/)
  })

  it('FAB is visible when session is active', () => {
    act(() => useWorkoutStore.setState({ draftDate: '2026-03-29' }))
    const { container } = render(<BottomNav />)
    const fabBtn = container.querySelector('[aria-label="種目を追加"]')
    expect(fabBtn?.className).not.toMatch(/invisible/)
  })
})
