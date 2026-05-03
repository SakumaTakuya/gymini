import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExerciseSearchField } from './ExerciseSearchField'

describe('ExerciseSearchField', () => {
  const defaultProps = {
    onSelectExercise: vi.fn(),
    searchExercises: vi.fn().mockReturnValue([]),
    createExercise: vi.fn().mockImplementation((name: string) => ({
      id: `new-${name}`,
      name,
    })),
  }

  it('検索inputのplaceholderを描画する', () => {
    render(<ExerciseSearchField {...defaultProps} />)
    expect(screen.getByPlaceholderText('種目を追加...')).toBeInTheDocument()
  })

  it('入力時に候補を表示する', () => {
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

  it('候補クリック時にonSelectExerciseを呼び出す', () => {
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

  it('完全一致がない場合に新規作成オプションを表示する', () => {
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

  it('新規作成オプションクリック時にcreateExerciseとonSelectExerciseを呼び出す', () => {
    const onSelectExercise = vi.fn()
    const createExercise = vi.fn().mockReturnValue({
      id: 'new-1',
      name: 'デッドリフト',
    })
    const searchExercises = vi.fn().mockReturnValue([])
    render(
      <ExerciseSearchField
        {...defaultProps}
        onSelectExercise={onSelectExercise}
        createExercise={createExercise}
        searchExercises={searchExercises}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('種目を追加...'), {
      target: { value: 'デッドリフト' },
    })
    fireEvent.click(screen.getByText(/「デッドリフト」を新規追加/))

    expect(createExercise).toHaveBeenCalledWith('デッドリフト')
    expect(onSelectExercise).toHaveBeenCalledWith({
      exerciseId: 'new-1',
      exerciseName: 'デッドリフト',
    })
  })

  it('選択後にinputをクリアする', () => {
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
