import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddSetButton } from './AddSetButton'

describe('AddSetButton', () => {
  it('aria-label で取得でき、クリックで onClick を呼ぶ', () => {
    const onClick = vi.fn()
    render(<AddSetButton onClick={onClick} aria-label="セットを追加" />)
    const btn = screen.getByRole('button', { name: 'セットを追加' })
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('label を渡すと可視テキストを表示する', () => {
    render(<AddSetButton onClick={vi.fn()} aria-label="セットを追加" label="セットを追加" />)
    expect(screen.getByText('セットを追加')).toBeInTheDocument()
  })

  it('label 未指定ならアイコンのみ (可視テキストなし)', () => {
    render(<AddSetButton onClick={vi.fn()} aria-label="追加" />)
    const btn = screen.getByRole('button', { name: '追加' })
    expect(btn.textContent).toBe('')
  })

  it('disabled で onClick を呼ばない', () => {
    const onClick = vi.fn()
    render(<AddSetButton onClick={onClick} aria-label="追加" disabled />)
    const btn = screen.getByRole('button', { name: '追加' })
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('共通の視覚言語クラス (rounded-xl / border-dashed / min-h-[44px]) を持つ', () => {
    render(<AddSetButton onClick={vi.fn()} aria-label="追加" />)
    const btn = screen.getByRole('button', { name: '追加' })
    expect(btn.className).toContain('rounded-xl')
    expect(btn.className).toContain('border-dashed')
    expect(btn.className).toContain('min-h-[44px]')
  })
})
