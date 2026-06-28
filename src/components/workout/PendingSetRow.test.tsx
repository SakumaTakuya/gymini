import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PendingSetRow } from './PendingSetRow'
import { setupHapticMocks } from '@/test/hapticMocks'

describe('PendingSetRow', () => {
  const defaultProps = {
    setNumber: 2,
    pendingSet: { weight: 60, reps: 10 },
    onComplete: vi.fn(),
    onWeightChange: vi.fn(),
    onRepsChange: vi.fn(),
  }

  it('セット番号を描画する', () => {
    render(<PendingSetRow {...defaultProps} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('初期値を持つ重量・レップ数のinputを描画する', () => {
    render(<PendingSetRow {...defaultProps} />)
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs[0]).toHaveValue(60)
    expect(inputs[1]).toHaveValue(10)
  })

  it('チェックボタンクリック時にonCompleteを呼び出す', () => {
    const onComplete = vi.fn()
    render(<PendingSetRow {...defaultProps} onComplete={onComplete} />)
    const checkButton = screen.getByRole('button', { name: /完了/ })
    fireEvent.click(checkButton)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('重量input変更時にonWeightChangeを呼び出す', () => {
    const onWeightChange = vi.fn()
    render(<PendingSetRow {...defaultProps} onWeightChange={onWeightChange} />)
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '65' } })
    expect(onWeightChange).toHaveBeenCalledWith(65)
  })

  it('レップ数input変更時にonRepsChangeを呼び出す', () => {
    const onRepsChange = vi.fn()
    render(<PendingSetRow {...defaultProps} onRepsChange={onRepsChange} />)
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[1], { target: { value: '8' } })
    expect(onRepsChange).toHaveBeenCalledWith(8)
  })

  describe('値が0のとき空表示（全消し可能）', () => {
    it('weight=0 / reps=0 のとき input は空表示になる', () => {
      render(
        <PendingSetRow {...defaultProps} pendingSet={{ weight: 0, reps: 0 }} />,
      )
      const [weightInput, repsInput] = screen.getAllByRole('spinbutton')
      expect(weightInput).toHaveValue(null)
      expect(repsInput).toHaveValue(null)
    })

    it('weight=0 / reps=0 のとき placeholder="0" を持つ', () => {
      render(
        <PendingSetRow {...defaultProps} pendingSet={{ weight: 0, reps: 0 }} />,
      )
      const [weightInput, repsInput] = screen.getAllByRole('spinbutton')
      expect(weightInput).toHaveAttribute('placeholder', '0')
      expect(repsInput).toHaveAttribute('placeholder', '0')
    })

    it('値が非0なら通常通り数値を表示する', () => {
      render(<PendingSetRow {...defaultProps} pendingSet={{ weight: 60, reps: 10 }} />)
      const [weightInput, repsInput] = screen.getAllByRole('spinbutton')
      expect(weightInput).toHaveValue(60)
      expect(repsInput).toHaveValue(10)
    })
  })

  it('左側に黒いバーインジケーターを持つ', () => {
    const { container } = render(<PendingSetRow {...defaultProps} />)
    const bar = container.querySelector('.bg-gym-black')
    expect(bar).toBeInTheDocument()
  })

  describe('Matas 数字拡大 + accent focus 発光', () => {
    it('weight input は text-3xl クラスを持つ', () => {
      render(<PendingSetRow {...defaultProps} />)
      const [weightInput] = screen.getAllByRole('spinbutton')
      expect(weightInput.className).toContain('text-3xl')
    })

    it('reps input は text-3xl クラスを持つ', () => {
      render(<PendingSetRow {...defaultProps} />)
      const [, repsInput] = screen.getAllByRole('spinbutton')
      expect(repsInput.className).toContain('text-3xl')
    })

    it('kg サフィックスは text-[10px] クラスを持つ (褪色)', () => {
      render(<PendingSetRow {...defaultProps} />)
      const kg = screen.getByText('kg')
      expect(kg.className).toContain('text-[10px]')
    })

    it('回 サフィックスは text-[10px] クラスを持つ', () => {
      render(<PendingSetRow {...defaultProps} />)
      const reps = screen.getByText('回')
      expect(reps.className).toContain('text-[10px]')
    })

    it('行コンテナに group クラスを持つ (focus-within の親)', () => {
      const { container } = render(<PendingSetRow {...defaultProps} />)
      const row = container.firstChild as HTMLElement
      expect(row.className).toContain('group')
    })

    it('accent stripe は group-focus-within で gym-accent に変化する', () => {
      const { container } = render(<PendingSetRow {...defaultProps} />)
      const stripe = container.querySelector('div.absolute.bg-gym-black')
      expect(stripe).toBeInTheDocument()
      expect(stripe!.className).toContain('group-focus-within:bg-gym-accent')
    })
  })

  describe('オートフォーカス動作', () => {
    it('重量inputがフォーカスを失うとレップ数inputにフォーカスする', () => {
      render(<PendingSetRow {...defaultProps} />)
      const [weightInput, repsInput] = screen.getAllByRole('spinbutton')
      fireEvent.blur(weightInput)
      expect(document.activeElement).toBe(repsInput)
    })

    it('重量inputでEnterを押すとレップ数inputにフォーカスする', () => {
      render(<PendingSetRow {...defaultProps} />)
      const [weightInput, repsInput] = screen.getAllByRole('spinbutton')
      fireEvent.keyDown(weightInput, { key: 'Enter' })
      expect(document.activeElement).toBe(repsInput)
    })
  })

  describe('セット完了トリガー', () => {
    it('レップ数inputでEnterを押しreps > 0のときonCompleteを呼び出す', () => {
      const onComplete = vi.fn()
      render(<PendingSetRow {...defaultProps} onComplete={onComplete} />)
      const repsInput = screen.getAllByRole('spinbutton')[1]
      fireEvent.keyDown(repsInput, { key: 'Enter' })
      expect(onComplete).toHaveBeenCalledOnce()
    })

    it('レップ数inputでEnterを押しrepsが0のときonCompleteを呼ばない', () => {
      const onComplete = vi.fn()
      render(
        <PendingSetRow
          {...defaultProps}
          pendingSet={{ weight: 60, reps: 0 }}
          onComplete={onComplete}
        />,
      )
      const repsInput = screen.getAllByRole('spinbutton')[1]
      fireEvent.keyDown(repsInput, { key: 'Enter' })
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('レップ数inputのblurではonCompleteを呼ばない', () => {
      const onComplete = vi.fn()
      render(<PendingSetRow {...defaultProps} onComplete={onComplete} />)
      const repsInput = screen.getAllByRole('spinbutton')[1]
      fireEvent.blur(repsInput)
      expect(onComplete).not.toHaveBeenCalled()
    })
  })

  describe('Cox / Badeen ハプティック', () => {
    let restore: () => void = () => {}
    afterEach(() => { restore() })

    it('完了ボタン押下で navigator.vibrate(10) を呼ぶ', () => {
      ;({ restore } = setupHapticMocks())
      render(<PendingSetRow {...defaultProps} />)
      fireEvent.click(screen.getByRole('button', { name: /完了/ }))
      expect(navigator.vibrate).toHaveBeenCalledWith(10)
    })

    it('prefers-reduced-motion: reduce の時は完了ボタン押下で vibrate を呼ばない', () => {
      ;({ restore } = setupHapticMocks({ reducedMotion: true }))
      render(<PendingSetRow {...defaultProps} />)
      fireEvent.click(screen.getByRole('button', { name: /完了/ }))
      expect(navigator.vibrate).not.toHaveBeenCalled()
    })
  })
})
