import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WorkoutFormPage from './WorkoutFormPage'

// Mock useWorkoutSession
vi.mock('../hooks/useWorkoutSession', () => ({
  default: vi.fn(),
}))

import useWorkoutSession from '../hooks/useWorkoutSession'

const makeSession = (overrides = {}) => ({
  draftDate: '2026-03-08',
  draftExercises: [],
  draftMemo: '',
  startSession: vi.fn(),
  startEditSession: vi.fn(),
  addExercise: vi.fn(),
  addSet: vi.fn(),
  updateSet: vi.fn(),
  updatePendingSet: vi.fn(),
  removeSet: vi.fn(),
  setDraftMemo: vi.fn(),
  saveSession: vi.fn(),
  cancelSession: vi.fn(),
  searchExercises: vi.fn().mockReturnValue([]),
  ...overrides,
})

describe('WorkoutFormPage', () => {
  beforeEach(() => {
    vi.mocked(useWorkoutSession).mockReturnValue(makeSession())
  })

  it('renders the form with date input', () => {
    render(<WorkoutFormPage onSave={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByDisplayValue('2026-03-08')).toBeInTheDocument()
  })

  it('save button calls saveSession', () => {
    const saveSession = vi.fn()
    const onSave = vi.fn()
    vi.mocked(useWorkoutSession).mockReturnValue(makeSession({ saveSession }))
    render(<WorkoutFormPage onSave={onSave} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /保存/i }))
    expect(saveSession).toHaveBeenCalled()
  })

  it('cancel button calls cancelSession and onCancel', () => {
    const cancelSession = vi.fn()
    const onCancel = vi.fn()
    vi.mocked(useWorkoutSession).mockReturnValue(makeSession({ cancelSession }))
    render(<WorkoutFormPage onSave={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /キャンセル/i }))
    expect(cancelSession).toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalled()
  })

  it('renders ExerciseSections for each exercise in draftExercises', () => {
    vi.mocked(useWorkoutSession).mockReturnValue(makeSession({
      draftExercises: [
        {
          exerciseId: 'bench',
          exerciseName: 'ベンチプレス',
          sets: [],
          pendingSet: { weight: 0, reps: 0, memo: '' },
        },
      ],
    }))
    render(<WorkoutFormPage onSave={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
  })
})
