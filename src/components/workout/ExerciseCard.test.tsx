import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExerciseCard } from './ExerciseCard'
import type { DraftExercise } from '../../schemas/workout'

const baseDraft: DraftExercise = {
  exerciseId: 'bench',
  exerciseName: 'ベンチプレス',
  sets: [],
  pendingSet: null,
  cardState: 'idle',
  editingSetIndex: null,
}

const defaultProps = {
  draftExercise: baseDraft,
  onActivate: vi.fn(),
  onComplete: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onDeleteExercise: vi.fn(),
  onToggle: vi.fn(),
  onWeightChange: vi.fn(),
  onRepsChange: vi.fn(),
}

describe('ExerciseCard', () => {
  describe('collapsed state', () => {
    it('shows only header with set count summary', () => {
      const draft: DraftExercise = {
        ...baseDraft,
        cardState: 'collapsed',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 65, reps: 8 },
        ],
      }
      render(<ExerciseCard {...defaultProps} draftExercise={draft} />)
      expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
      expect(screen.getByText(/2 Sets/)).toBeInTheDocument()
    })

    it('calls onToggle when header is clicked', () => {
      const onToggle = vi.fn()
      const draft: DraftExercise = { ...baseDraft, cardState: 'collapsed' }
      render(
        <ExerciseCard {...defaultProps} draftExercise={draft} onToggle={onToggle} />,
      )
      fireEvent.click(screen.getByText('ベンチプレス'))
      expect(onToggle).toHaveBeenCalledOnce()
    })
  })

  describe('idle state', () => {
    it('shows completed sets and add button', () => {
      const draft: DraftExercise = {
        ...baseDraft,
        cardState: 'idle',
        sets: [{ weight: 60, reps: 10 }],
      }
      render(<ExerciseCard {...defaultProps} draftExercise={draft} />)
      expect(screen.getByText('60')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /追加/ })).toBeInTheDocument()
    })

    it('calls onActivate when add button is clicked', () => {
      const onActivate = vi.fn()
      render(
        <ExerciseCard {...defaultProps} onActivate={onActivate} />,
      )
      fireEvent.click(screen.getByRole('button', { name: /追加/ }))
      expect(onActivate).toHaveBeenCalledOnce()
    })
  })

  describe('recording state', () => {
    it('shows completed sets and pending set row', () => {
      const draft: DraftExercise = {
        ...baseDraft,
        cardState: 'recording',
        sets: [{ weight: 60, reps: 10 }],
        pendingSet: { weight: 60, reps: 10 },
      }
      render(<ExerciseCard {...defaultProps} draftExercise={draft} />)
      // Completed set
      expect(screen.getByText('60')).toBeInTheDocument()
      // Pending set inputs
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs).toHaveLength(2)
    })
  })
})
