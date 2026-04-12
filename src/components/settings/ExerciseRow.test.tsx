import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExerciseRow } from './ExerciseRow'

const exercise = { id: 'ex-1', name: 'ベンチプレス' }

describe('ExerciseRow', () => {
  it('displays exercise name', () => {
    render(<ExerciseRow exercise={exercise} onEdit={vi.fn()} />)
    expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
  })

  it('calls onEdit with exercise when edit button is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<ExerciseRow exercise={exercise} onEdit={onEdit} />)

    await user.click(screen.getByRole('button', { name: 'ベンチプレスを編集' }))
    expect(onEdit).toHaveBeenCalledWith(exercise)
  })

  it('does not render a delete button in view mode (削除は編集モード内に移設)', () => {
    render(<ExerciseRow exercise={exercise} onEdit={vi.fn()} />)
    expect(
      screen.queryByRole('button', { name: 'ベンチプレスを削除' }),
    ).not.toBeInTheDocument()
  })

  it('ensures edit button tap target is expanded beyond the 32px visual size', () => {
    render(<ExerciseRow exercise={exercise} onEdit={vi.fn()} />)
    const editBtn = screen.getByRole('button', { name: 'ベンチプレスを編集' })
    // 表示は w-8 h-8 (32px) だが、before:inset-[-8px] で実タップ領域を 48px に拡張
    expect(editBtn.className).toContain('w-8')
    expect(editBtn.className).toContain('h-8')
    expect(editBtn.className).toContain('before:absolute')
    expect(editBtn.className).toMatch(/before:inset-\[-?\d+px\]/)
  })
})
