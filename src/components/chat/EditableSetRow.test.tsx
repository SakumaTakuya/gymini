import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EditableSetRow } from './EditableSetRow'

describe('EditableSetRow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseProps = {
    setNumber: 1,
    weight: 60,
    reps: 10,
    isSettled: false,
    onWeightChange: vi.fn(),
    onRepsChange: vi.fn(),
    onRemove: vi.fn(),
  }

  it('setNumber と現在値を表示する', () => {
    render(<EditableSetRow {...baseProps} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('60')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
  })

  it('weight が 0 のとき空文字（プレースホルダ）として表示する', () => {
    render(<EditableSetRow {...baseProps} weight={0} reps={0} />)
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[]
    expect(inputs[0].value).toBe('')
    expect(inputs[1].value).toBe('')
  })

  it('weight 入力で onWeightChange を Number 値で呼ぶ', () => {
    const onWeightChange = vi.fn()
    render(<EditableSetRow {...baseProps} onWeightChange={onWeightChange} />)
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '70' } })
    expect(onWeightChange).toHaveBeenCalledWith(70)
  })

  it('reps 入力で onRepsChange を Number 値で呼ぶ', () => {
    const onRepsChange = vi.fn()
    render(<EditableSetRow {...baseProps} onRepsChange={onRepsChange} />)
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[1], { target: { value: '8' } })
    expect(onRepsChange).toHaveBeenCalledWith(8)
  })

  it('削除ボタンクリックで onRemove を呼ぶ', () => {
    const onRemove = vi.fn()
    render(<EditableSetRow {...baseProps} onRemove={onRemove} />)
    fireEvent.click(screen.getByRole('button', { name: 'セットを削除' }))
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('isSettled=true のとき入力と削除が disabled', () => {
    render(<EditableSetRow {...baseProps} isSettled={true} />)
    for (const input of screen.getAllByRole('spinbutton')) {
      expect(input).toBeDisabled()
    }
    expect(screen.getByRole('button', { name: 'セットを削除' })).toBeDisabled()
  })
})
