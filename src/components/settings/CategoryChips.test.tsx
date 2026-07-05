import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryChips } from './CategoryChips'

describe('CategoryChips', () => {
  it('全部位のチップを描画する（未分類含む）', () => {
    render(<CategoryChips value="unassigned" onChange={vi.fn()} />)
    expect(screen.getByRole('radio', { name: '胸' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '未分類' })).toBeInTheDocument()
  })

  it('選択中のチップに aria-checked が付く', () => {
    render(<CategoryChips value="chest" onChange={vi.fn()} />)
    expect(screen.getByRole('radio', { name: '胸' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('radio', { name: '背中' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('チップをタップすると onChange をカテゴリ付きで呼ぶ', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CategoryChips value="unassigned" onChange={onChange} />)
    await user.click(screen.getByRole('radio', { name: '脚' }))
    expect(onChange).toHaveBeenCalledWith('legs')
  })
})
