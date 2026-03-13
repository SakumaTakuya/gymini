import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExerciseSection from './ExerciseSection'

const makeExercise = (overrides = {}) => ({
  exerciseId: 'bench',
  exerciseName: 'ベンチプレス',
  sets: [],
  pendingSet: { weight: 0, reps: 0, memo: '' },
  ...overrides,
})

describe('ExerciseSection', () => {
  it('renders exercise name', () => {
    render(
      <ExerciseSection
        exercise={makeExercise()}
        exerciseIndex={0}
        onAddSet={vi.fn()}
        onUpdateSet={vi.fn()}
        onPendingSetChange={vi.fn()}
      />
    )
    expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
  })

  it('shows confirmed sets', () => {
    const exercise = makeExercise({
      sets: [{ weight: 60, reps: 10, memo: '' }],
    })
    render(
      <ExerciseSection
        exercise={exercise}
        exerciseIndex={0}
        onAddSet={vi.fn()}
        onUpdateSet={vi.fn()}
        onPendingSetChange={vi.fn()}
      />
    )
    expect(screen.getAllByText('60')[0]).toBeInTheDocument()
  })

  it('calls onAddSet when セット追加 is clicked', () => {
    const onAddSet = vi.fn()
    render(
      <ExerciseSection
        exercise={makeExercise()}
        exerciseIndex={0}
        onAddSet={onAddSet}
        onUpdateSet={vi.fn()}
        onPendingSetChange={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /セット追加/i }))
    expect(onAddSet).toHaveBeenCalledWith(0, expect.any(Object))
  })
})
