import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActiveSessionView } from './ActiveSessionView'
import { useWorkoutSessionStore } from '../../stores/workoutSessionStore'
import type { DateString } from '../../schemas/date'

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

  it('renders workout heading', () => {
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    render(<ActiveSessionView />)
    expect(screen.getByText('ワークアウト')).toBeInTheDocument()
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
})
