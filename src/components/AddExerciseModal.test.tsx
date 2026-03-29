import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from '@testing-library/react'
import useWorkoutStore from '../stores/workoutStore'
import AddExerciseModal from './AddExerciseModal'

const EXERCISE_KEY = 'gymini:exercises'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(
    EXERCISE_KEY,
    JSON.stringify([
      { id: 'bench-press', name: 'ベンチプレス' },
      { id: 'squat', name: 'スクワット' },
    ])
  )
  act(() => {
    useWorkoutStore.setState({
      workouts: [],
      draftDate: '2026-03-29',
      draftExercises: [],
      draftMemo: '',
      draftWorkoutId: null,
    })
  })
})

describe('AddExerciseModal', () => {
  it('does not render content when closed', () => {
    render(<AddExerciseModal open={false} onClose={() => {}} />)
    expect(screen.queryByPlaceholderText(/検索/i)).not.toBeInTheDocument()
  })

  it('renders search input when open', () => {
    render(<AddExerciseModal open={true} onClose={() => {}} />)
    expect(screen.getByPlaceholderText(/種目を検索/i)).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(<AddExerciseModal open={true} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /閉じる|close|✕|×/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('adds exercise to store when selected', async () => {
    render(<AddExerciseModal open={true} onClose={() => {}} />)
    const input = screen.getByPlaceholderText(/種目を検索/i)
    await userEvent.type(input, 'ベンチ')
    const results = await screen.findAllByRole('listitem')
    expect(results.length).toBeGreaterThan(0)
    await userEvent.click(results[0])
    expect(useWorkoutStore.getState().draftExercises).toHaveLength(1)
  })
})
