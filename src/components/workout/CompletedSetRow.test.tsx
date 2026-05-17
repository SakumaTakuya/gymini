import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CompletedSetRow } from './CompletedSetRow'

describe('CompletedSetRow', () => {
  const defaultProps = {
    set: { weight: 60, reps: 10 },
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  it('重量とレップ数を描画する', () => {
    render(<CompletedSetRow {...defaultProps} />)
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('ゴミ箱ボタンクリック時にonDeleteを呼び出す', () => {
    const onDelete = vi.fn()
    render(<CompletedSetRow {...defaultProps} onDelete={onDelete} />)
    const deleteButton = screen.getByRole('button', { name: /削除/ })
    fireEvent.click(deleteButton)
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('鉛筆ボタンクリック時にonEditを呼び出す', () => {
    const onEdit = vi.fn()
    render(<CompletedSetRow {...defaultProps} onEdit={onEdit} />)
    const editButton = screen.getByRole('button', { name: /編集/ })
    fireEvent.click(editButton)
    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('bg-gym-zinc-50とrounded-xlのスタイルを持つ', () => {
    const { container } = render(<CompletedSetRow {...defaultProps} />)
    const row = container.firstChild as HTMLElement
    expect(row.className).toContain('bg-gym-zinc-50')
    expect(row.className).toContain('rounded-xl')
  })

  describe('Matas 数字拡大', () => {
    it('weight/reps 表示の p タグは text-2xl クラスを持つ', () => {
      const { container } = render(<CompletedSetRow {...defaultProps} />)
      const paras = container.querySelectorAll('p')
      expect(paras).toHaveLength(2)
      expect(paras[0].className).toContain('text-2xl')
      expect(paras[1].className).toContain('text-2xl')
    })

    it('kg サフィックスは text-[10px] クラスを持つ', () => {
      render(<CompletedSetRow {...defaultProps} />)
      const kg = screen.getByText('kg')
      expect(kg.className).toContain('text-[10px]')
    })

    it('回 サフィックスは text-[10px] クラスを持つ', () => {
      render(<CompletedSetRow {...defaultProps} />)
      const reps = screen.getByText('回')
      expect(reps.className).toContain('text-[10px]')
    })
  })
})
