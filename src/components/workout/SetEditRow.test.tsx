import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SetEditRow } from './SetEditRow'

describe('SetEditRow', () => {
  const defaultProps = {
    setNumber: 2,
    weight: 60,
    reps: 10,
    onWeightChange: vi.fn(),
    onRepsChange: vi.fn(),
    trailing: <button type="button">trailing</button>,
  }

  it('セット番号・重量・回数を描画する', () => {
    render(<SetEditRow {...defaultProps} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs[0]).toHaveValue(60)
    expect(inputs[1]).toHaveValue(10)
  })

  it('数字 input は text-3xl tabular-nums を持つ', () => {
    render(<SetEditRow {...defaultProps} />)
    const [weightInput, repsInput] = screen.getAllByRole('spinbutton')
    expect(weightInput.className).toContain('text-3xl')
    expect(weightInput.className).toContain('tabular-nums')
    expect(repsInput.className).toContain('text-3xl')
  })

  it('kg/回 サフィックスは text-[10px]', () => {
    render(<SetEditRow {...defaultProps} />)
    expect(screen.getByText('kg').className).toContain('text-[10px]')
    expect(screen.getByText('回').className).toContain('text-[10px]')
  })

  it('行は group、accent stripe は group-focus-within:bg-gym-accent で発光', () => {
    const { container } = render(<SetEditRow {...defaultProps} />)
    const row = container.firstChild as HTMLElement
    expect(row.className).toContain('group')
    const stripe = container.querySelector('div.absolute.bg-gym-black')
    expect(stripe).toBeInTheDocument()
    expect(stripe!.className).toContain('group-focus-within:bg-gym-accent')
  })

  it('trailing slot を描画する', () => {
    render(<SetEditRow {...defaultProps} trailing={<button type="button">完了X</button>} />)
    expect(screen.getByRole('button', { name: '完了X' })).toBeInTheDocument()
  })

  it('disabled で input が無効化される', () => {
    render(<SetEditRow {...defaultProps} disabled />)
    const [weightInput, repsInput] = screen.getAllByRole('spinbutton')
    expect(weightInput).toBeDisabled()
    expect(repsInput).toBeDisabled()
  })

  it('onWeightChange / onRepsChange を発火する', () => {
    const onWeightChange = vi.fn()
    const onRepsChange = vi.fn()
    render(<SetEditRow {...defaultProps} onWeightChange={onWeightChange} onRepsChange={onRepsChange} />)
    const [weightInput, repsInput] = screen.getAllByRole('spinbutton')
    fireEvent.change(weightInput, { target: { value: '65' } })
    expect(onWeightChange).toHaveBeenCalledWith(65)
    fireEvent.change(repsInput, { target: { value: '8' } })
    expect(onRepsChange).toHaveBeenCalledWith(8)
  })

  it('blankOnZero: weight=0 / reps=0 のとき空表示 + placeholder', () => {
    render(
      <SetEditRow
        {...defaultProps}
        weight={0}
        reps={0}
        blankOnZero
        weightPlaceholder="kg"
        repsPlaceholder="回"
      />,
    )
    const [weightInput, repsInput] = screen.getAllByRole('spinbutton')
    expect(weightInput).toHaveValue(null)
    expect(repsInput).toHaveValue(null)
    expect(weightInput).toHaveAttribute('placeholder', 'kg')
    expect(repsInput).toHaveAttribute('placeholder', '回')
  })

  it('className を行 div に追加できる (animate-appear など)', () => {
    const { container } = render(<SetEditRow {...defaultProps} className="animate-appear" />)
    const row = container.firstChild as HTMLElement
    expect(row.className).toContain('animate-appear')
  })

  it('weight に next / reps に done の enterKeyHint を設定する', () => {
    render(<SetEditRow {...defaultProps} />)
    const [weightInput, repsInput] = screen.getAllByRole('spinbutton')
    expect(weightInput).toHaveAttribute('enterkeyhint', 'next')
    expect(repsInput).toHaveAttribute('enterkeyhint', 'done')
  })

  it('数値 input に inputMode を付けない（モバイルで Enter キーを残し enterKeyHint を効かせるため）', () => {
    render(<SetEditRow {...defaultProps} />)
    const [weightInput, repsInput] = screen.getAllByRole('spinbutton')
    expect(weightInput).not.toHaveAttribute('inputmode')
    expect(repsInput).not.toHaveAttribute('inputmode')
  })
})
