import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExerciseSearchField } from './ExerciseSearchField'

describe('ExerciseSearchField', () => {
  const defaultProps = {
    onSelectExercise: vi.fn(),
    searchExercises: vi.fn().mockReturnValue([]),
  }

  it('renders search input placeholder', () => {
    render(<ExerciseSearchField {...defaultProps} />)
    expect(screen.getByPlaceholderText('種目を追加...')).toBeInTheDocument()
  })

  it('shows candidates on input', () => {
    const searchExercises = vi.fn().mockReturnValue([
      { id: '1', name: 'ベンチプレス' },
      { id: '2', name: 'インクラインベンチプレス' },
    ])
    render(
      <ExerciseSearchField
        {...defaultProps}
        searchExercises={searchExercises}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('種目を追加...'), {
      target: { value: 'ベンチ' },
    })

    expect(searchExercises).toHaveBeenCalledWith('ベンチ')
    expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
    expect(screen.getByText('インクラインベンチプレス')).toBeInTheDocument()
  })

  it('calls onSelectExercise when candidate is clicked', () => {
    const onSelectExercise = vi.fn()
    const searchExercises = vi.fn().mockReturnValue([
      { id: '1', name: 'ベンチプレス' },
    ])
    render(
      <ExerciseSearchField
        {...defaultProps}
        onSelectExercise={onSelectExercise}
        searchExercises={searchExercises}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('種目を追加...'), {
      target: { value: 'ベンチ' },
    })
    fireEvent.click(screen.getByText('ベンチプレス'))

    expect(onSelectExercise).toHaveBeenCalledWith({
      exerciseId: '1',
      exerciseName: 'ベンチプレス',
    })
  })

  it('shows create option when no exact match', () => {
    const searchExercises = vi.fn().mockReturnValue([])
    render(
      <ExerciseSearchField
        {...defaultProps}
        searchExercises={searchExercises}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('種目を追加...'), {
      target: { value: 'デッドリフト' },
    })

    expect(screen.getByText(/「デッドリフト」を新規追加/)).toBeInTheDocument()
  })

  it('clears input after selection', () => {
    const searchExercises = vi.fn().mockReturnValue([
      { id: '1', name: 'ベンチプレス' },
    ])
    render(
      <ExerciseSearchField
        {...defaultProps}
        searchExercises={searchExercises}
      />,
    )

    const input = screen.getByPlaceholderText('種目を追加...')
    fireEvent.change(input, { target: { value: 'ベンチ' } })
    fireEvent.click(screen.getByText('ベンチプレス'))

    expect(input).toHaveValue('')
  })
})
