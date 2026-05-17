import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CompletedSetRow } from './CompletedSetRow'

describe('CompletedSetRow', () => {
  const defaultProps = {
    setNumber: 2,
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

    it('行は animate-pop を持つ (完了直後の scale spring、animate-appear は廃止)', () => {
      const { container } = render(<CompletedSetRow {...defaultProps} />)
      const row = container.firstChild as HTMLElement
      expect(row.className).toContain('animate-pop')
      expect(row.className).not.toContain('animate-appear')
    })
  })

  describe('Matas 章番号透かし', () => {
    it('setNumber を背景に透かしとして描画する', () => {
      const { container } = render(<CompletedSetRow {...defaultProps} setNumber={3} />)
      const watermark = container.querySelector('[data-testid="completed-set-watermark"]')
      expect(watermark).toBeInTheDocument()
      expect(watermark!.textContent).toBe('3')
    })

    it('透かしは text-5xl text-gym-zinc-100 absolute pointer-events-none を持つ', () => {
      const { container } = render(<CompletedSetRow {...defaultProps} />)
      const watermark = container.querySelector('[data-testid="completed-set-watermark"]')
      expect(watermark!.className).toContain('text-5xl')
      expect(watermark!.className).toContain('text-gym-zinc-100')
      expect(watermark!.className).toContain('absolute')
      expect(watermark!.className).toContain('pointer-events-none')
    })

    it('行 div は relative overflow-hidden を持ち、透かしをクリップする', () => {
      const { container } = render(<CompletedSetRow {...defaultProps} />)
      const row = container.firstChild as HTMLElement
      expect(row.className).toContain('relative')
      expect(row.className).toContain('overflow-hidden')
    })
  })
})
