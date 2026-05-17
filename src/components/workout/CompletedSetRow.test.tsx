import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
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

  it('foreground は bg-gym-zinc-50 rounded-xl', () => {
    render(<CompletedSetRow {...defaultProps} />)
    const fg = screen.getByTestId('completed-set-foreground')
    expect(fg.className).toContain('bg-gym-zinc-50')
    expect(fg.className).toContain('rounded-xl')
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

    it('container は animate-pop を持つ (完了直後の scale spring、animate-appear は廃止)', () => {
      render(<CompletedSetRow {...defaultProps} />)
      const row = screen.getByTestId('completed-set-row')
      expect(row.className).toContain('animate-pop')
      expect(row.className).not.toContain('animate-appear')
    })

    it('foreground は animate-pop を持たない (swipe の transform と競合するため)', () => {
      render(<CompletedSetRow {...defaultProps} />)
      const fg = screen.getByTestId('completed-set-foreground')
      expect(fg.className).not.toContain('animate-pop')
    })
  })

  describe('Matas 章番号透かし', () => {
    it('setNumber を背景に透かしとして描画する', () => {
      const { container } = render(<CompletedSetRow {...defaultProps} setNumber={3} />)
      const watermark = container.querySelector('[data-testid="completed-set-watermark"]')
      expect(watermark).toBeInTheDocument()
      expect(watermark!.textContent).toBe('3')
    })

    it('透かしは text-5xl text-gym-zinc-200 absolute pointer-events-none を持つ', () => {
      const { container } = render(<CompletedSetRow {...defaultProps} />)
      const watermark = container.querySelector('[data-testid="completed-set-watermark"]')
      expect(watermark!.className).toContain('text-5xl')
      expect(watermark!.className).toContain('text-gym-zinc-200')
      expect(watermark!.className).toContain('absolute')
      expect(watermark!.className).toContain('pointer-events-none')
    })

    it('container (row) は relative overflow-hidden を持ち、swipe で外れた foreground をクリップする', () => {
      render(<CompletedSetRow {...defaultProps} />)
      const row = screen.getByTestId('completed-set-row')
      expect(row.className).toContain('relative')
      expect(row.className).toContain('overflow-hidden')
    })
  })

  describe('Badeen swipe 統合', () => {
    function firePointer(
      el: Element,
      type: 'pointerdown' | 'pointermove' | 'pointerup',
      opts: { clientX?: number; pointerType?: string } = {},
    ) {
      const ev = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        ...(opts.clientX !== undefined ? { clientX: opts.clientX } : {}),
      })
      Object.defineProperty(ev, 'pointerType', {
        value: opts.pointerType ?? 'touch',
        configurable: true,
      })
      act(() => { el.dispatchEvent(ev) })
    }

    it('a11y: 削除ボタンは sr-only で残り、role=button で取得可能 (screen reader 互換)', () => {
      render(<CompletedSetRow {...defaultProps} />)
      const btn = screen.getByRole('button', { name: /削除/ })
      expect(btn.className).toContain('sr-only')
    })

    it('a11y: 編集ボタンは sr-only で残り、role=button で取得可能', () => {
      render(<CompletedSetRow {...defaultProps} />)
      const btn = screen.getByRole('button', { name: /編集/ })
      expect(btn.className).toContain('sr-only')
    })

    it('foreground を touch swipe-left すると onDelete が呼ばれる (大きく引いてリリース)', () => {
      const onDelete = vi.fn()
      render(<CompletedSetRow {...defaultProps} onDelete={onDelete} setNumber={1} />)
      const fg = screen.getByTestId('completed-set-foreground')
      // fallback rowWidth = 320, threshold = 320 * 0.4 = 128
      firePointer(fg, 'pointerdown', { clientX: 300 })
      firePointer(fg, 'pointermove', { clientX: 100 }) // dx = -200, |200| >= 128
      firePointer(fg, 'pointerup', { clientX: 100 })
      expect(onDelete).toHaveBeenCalledOnce()
    })

    it('foreground を touch swipe-right すると onEdit が呼ばれる', () => {
      const onEdit = vi.fn()
      render(<CompletedSetRow {...defaultProps} onEdit={onEdit} setNumber={1} />)
      const fg = screen.getByTestId('completed-set-foreground')
      firePointer(fg, 'pointerdown', { clientX: 0 })
      firePointer(fg, 'pointermove', { clientX: 200 })
      firePointer(fg, 'pointerup', { clientX: 200 })
      expect(onEdit).toHaveBeenCalledOnce()
    })

    it('小さな swipe (デッドゾーン内) では onDelete/onEdit を呼ばない', () => {
      const onDelete = vi.fn()
      const onEdit = vi.fn()
      render(<CompletedSetRow {...defaultProps} onDelete={onDelete} onEdit={onEdit} />)
      const fg = screen.getByTestId('completed-set-foreground')
      firePointer(fg, 'pointerdown', { clientX: 100 })
      firePointer(fg, 'pointermove', { clientX: 105 }) // dx=5
      firePointer(fg, 'pointerup', { clientX: 105 })
      expect(onDelete).not.toHaveBeenCalled()
      expect(onEdit).not.toHaveBeenCalled()
    })
  })
})
