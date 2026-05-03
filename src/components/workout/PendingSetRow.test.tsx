import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PendingSetRow } from './PendingSetRow'

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

  it('左側に黒いバーインジケーターを持つ', () => {
    const { container } = render(<PendingSetRow {...defaultProps} />)
    const bar = container.querySelector('.bg-black')
    expect(bar).toBeInTheDocument()
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

  describe('オートコンプリート動作', () => {
    it('レップ数inputがフォーカスを失いreps > 0のときonCompleteを呼び出す', () => {
      const onComplete = vi.fn()
      render(<PendingSetRow {...defaultProps} onComplete={onComplete} />)
      const repsInput = screen.getAllByRole('spinbutton')[1]
      fireEvent.blur(repsInput)
      expect(onComplete).toHaveBeenCalledOnce()
    })

    it('レップ数inputでEnterを押しreps > 0のときonCompleteを呼び出す', () => {
      const onComplete = vi.fn()
      render(<PendingSetRow {...defaultProps} onComplete={onComplete} />)
      const repsInput = screen.getAllByRole('spinbutton')[1]
      fireEvent.keyDown(repsInput, { key: 'Enter' })
      expect(onComplete).toHaveBeenCalledOnce()
    })

    it('レップ数inputがフォーカスを失いrepsが0のときonCompleteを呼ばない', () => {
      const onComplete = vi.fn()
      render(
        <PendingSetRow
          {...defaultProps}
          pendingSet={{ weight: 60, reps: 0 }}
          onComplete={onComplete}
        />,
      )
      const repsInput = screen.getAllByRole('spinbutton')[1]
      fireEvent.blur(repsInput)
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('フォーカスが完了ボタンに移動する場合はレップ数blurでonCompleteを呼ばない', () => {
      const onComplete = vi.fn()
      render(<PendingSetRow {...defaultProps} onComplete={onComplete} />)
      const repsInput = screen.getAllByRole('spinbutton')[1]
      const checkButton = screen.getByRole('button', { name: /完了/ })
      fireEvent.blur(repsInput, { relatedTarget: checkButton })
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('ボタンのpointerdownとレップ数blurが同時に発火してもonCompleteを1回だけ呼ぶ', () => {
      const onComplete = vi.fn()
      render(<PendingSetRow {...defaultProps} onComplete={onComplete} />)
      const repsInput = screen.getAllByRole('spinbutton')[1]
      const checkButton = screen.getByRole('button', { name: /完了/ })
      // pointerdown fires before blur when tapping the button; blur should be suppressed
      fireEvent.pointerDown(checkButton)
      fireEvent.blur(repsInput)
      fireEvent.click(checkButton)
      expect(onComplete).toHaveBeenCalledOnce()
    })
  })
})
