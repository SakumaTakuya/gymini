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

  it('renders set number', () => {
    render(<PendingSetRow {...defaultProps} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders weight and reps inputs with initial values', () => {
    render(<PendingSetRow {...defaultProps} />)
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs[0]).toHaveValue(60)
    expect(inputs[1]).toHaveValue(10)
  })

  it('calls onComplete when check button is clicked', () => {
    const onComplete = vi.fn()
    render(<PendingSetRow {...defaultProps} onComplete={onComplete} />)
    const checkButton = screen.getByRole('button', { name: /完了/ })
    fireEvent.click(checkButton)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('calls onWeightChange when weight input changes', () => {
    const onWeightChange = vi.fn()
    render(<PendingSetRow {...defaultProps} onWeightChange={onWeightChange} />)
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '65' } })
    expect(onWeightChange).toHaveBeenCalledWith(65)
  })

  it('calls onRepsChange when reps input changes', () => {
    const onRepsChange = vi.fn()
    render(<PendingSetRow {...defaultProps} onRepsChange={onRepsChange} />)
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[1], { target: { value: '8' } })
    expect(onRepsChange).toHaveBeenCalledWith(8)
  })

  it('has left black bar indicator', () => {
    const { container } = render(<PendingSetRow {...defaultProps} />)
    const bar = container.querySelector('.bg-black')
    expect(bar).toBeInTheDocument()
  })

  describe('auto-focus behavior', () => {
    it('focuses reps input when weight input loses focus', () => {
      render(<PendingSetRow {...defaultProps} />)
      const [weightInput, repsInput] = screen.getAllByRole('spinbutton')
      fireEvent.blur(weightInput)
      expect(document.activeElement).toBe(repsInput)
    })

    it('focuses reps input when Enter is pressed in weight input', () => {
      render(<PendingSetRow {...defaultProps} />)
      const [weightInput, repsInput] = screen.getAllByRole('spinbutton')
      fireEvent.keyDown(weightInput, { key: 'Enter' })
      expect(document.activeElement).toBe(repsInput)
    })
  })

  describe('auto-complete behavior', () => {
    it('calls onComplete when reps input loses focus and reps > 0', () => {
      const onComplete = vi.fn()
      render(<PendingSetRow {...defaultProps} onComplete={onComplete} />)
      const repsInput = screen.getAllByRole('spinbutton')[1]
      fireEvent.blur(repsInput)
      expect(onComplete).toHaveBeenCalledOnce()
    })

    it('calls onComplete when Enter is pressed in reps input and reps > 0', () => {
      const onComplete = vi.fn()
      render(<PendingSetRow {...defaultProps} onComplete={onComplete} />)
      const repsInput = screen.getAllByRole('spinbutton')[1]
      fireEvent.keyDown(repsInput, { key: 'Enter' })
      expect(onComplete).toHaveBeenCalledOnce()
    })

    it('does not call onComplete when reps input loses focus and reps is 0', () => {
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

    it('does not call onComplete on reps blur when focus moves to complete button', () => {
      const onComplete = vi.fn()
      render(<PendingSetRow {...defaultProps} onComplete={onComplete} />)
      const repsInput = screen.getAllByRole('spinbutton')[1]
      const checkButton = screen.getByRole('button', { name: /完了/ })
      fireEvent.blur(repsInput, { relatedTarget: checkButton })
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('calls onComplete only once when button pointerdown and reps blur fire together', () => {
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
