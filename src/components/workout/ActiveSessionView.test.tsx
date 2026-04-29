import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActiveSessionView } from './ActiveSessionView'
import { useWorkoutSessionStore } from '../../stores/workoutSessionStore'
import type { DateString, ISODateTimeString } from '../../schemas/date'

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

  it('renders 終了 button', () => {
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    render(<ActiveSessionView />)
    expect(screen.getByRole('button', { name: '終了' })).toBeInTheDocument()
  })

  it('clicking 終了 button ends the session', () => {
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    render(<ActiveSessionView />)
    fireEvent.click(screen.getByRole('button', { name: '終了' }))
    expect(useWorkoutSessionStore.getState().isActive).toBe(false)
  })

  it('renders timer at zero immediately after session start', () => {
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    render(<ActiveSessionView />)
    expect(screen.getByText('00:00:00')).toBeInTheDocument()
  })

  it('renders elapsed time pill in HH:MM:SS format', () => {
    const startedAt = new Date(Date.now() - (14 * 60 + 32) * 1000).toISOString()
    useWorkoutSessionStore.setState({
      isActive: true,
      startedAt: startedAt as ISODateTimeString,
      date: '2026-03-08' as DateString,
      draftExercises: [],
    })
    render(<ActiveSessionView />)
    expect(screen.getByText(/^00:14:3[12]$/)).toBeInTheDocument()
  })
})
