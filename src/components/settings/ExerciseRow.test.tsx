import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExerciseRow } from './ExerciseRow'

const exercise = { id: 'ex-1', name: 'ベンチプレス' }

describe('ExerciseRow', () => {
  it('displays exercise name', () => {
    render(<ExerciseRow exercise={exercise} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
  })

  it('calls onEdit with exercise when edit button is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<ExerciseRow exercise={exercise} onEdit={onEdit} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'ベンチプレスを編集' }))
    expect(onEdit).toHaveBeenCalledWith(exercise)
  })

  it('calls onDelete with exercise when delete button is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<ExerciseRow exercise={exercise} onEdit={vi.fn()} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: 'ベンチプレスを削除' }))
    expect(onDelete).toHaveBeenCalledWith(exercise)
  })

  it('ensures tap targets have min 44px', () => {
    render(<ExerciseRow exercise={exercise} onEdit={vi.fn()} onDelete={vi.fn()} />)

    const editBtn = screen.getByRole('button', { name: 'ベンチプレスを編集' })
    const deleteBtn = screen.getByRole('button', { name: 'ベンチプレスを削除' })

    expect(editBtn.className).toContain('min-h-[44px]')
    expect(editBtn.className).toContain('min-w-[44px]')
    expect(deleteBtn.className).toContain('min-h-[44px]')
    expect(deleteBtn.className).toContain('min-w-[44px]')
  })
})
