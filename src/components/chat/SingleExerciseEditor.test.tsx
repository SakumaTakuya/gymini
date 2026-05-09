import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SingleExerciseEditor } from './SingleExerciseEditor'

describe('SingleExerciseEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseProps = {
    exerciseLabel: 'ベンチプレス',
    initialSets: [{ weight: 60, reps: 10 }],
    isSettled: false,
    label: '記録する',
    onApprove: vi.fn(),
    onReject: vi.fn(),
  }

  it('exerciseLabel と初期 sets を表示する', () => {
    render(<SingleExerciseEditor {...baseProps} />)
    expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
    expect(screen.getByDisplayValue('60')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
  })

  it('セット追加ボタンで sets が増える', () => {
    render(<SingleExerciseEditor {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /セットを追加/ }))
    expect(screen.getAllByRole('spinbutton')).toHaveLength(4)
  })

  it('セット削除ボタンで sets が減る', () => {
    render(
      <SingleExerciseEditor
        {...baseProps}
        initialSets={[
          { weight: 60, reps: 10 },
          { weight: 65, reps: 8 },
        ]}
      />,
    )
    expect(screen.getAllByRole('spinbutton')).toHaveLength(4)
    fireEvent.click(screen.getAllByRole('button', { name: 'セットを削除' })[0])
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2)
  })

  it('全 sets が入力済みのとき onApprove に最新の sets を渡す', () => {
    const onApprove = vi.fn()
    render(<SingleExerciseEditor {...baseProps} onApprove={onApprove} />)
    fireEvent.click(screen.getByRole('button', { name: /記録する/ }))
    expect(onApprove).toHaveBeenCalledWith([{ weight: 60, reps: 10 }])
  })

  it('未入力の set があると承認ボタンが disabled になりヒントが出る', () => {
    render(
      <SingleExerciseEditor
        {...baseProps}
        initialSets={[{ weight: 0, reps: 0 }]}
      />,
    )
    expect(screen.getByRole('button', { name: /記録する/ })).toBeDisabled()
    expect(screen.getByText('重量と回数を入力してください')).toBeInTheDocument()
  })

  it('キャンセルで onReject を呼ぶ', () => {
    const onReject = vi.fn()
    render(<SingleExerciseEditor {...baseProps} onReject={onReject} />)
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(onReject).toHaveBeenCalledOnce()
  })

  it('isSettled=true のとき入力と全ボタンが disabled', () => {
    render(<SingleExerciseEditor {...baseProps} isSettled={true} />)
    for (const input of screen.getAllByRole('spinbutton')) {
      expect(input).toBeDisabled()
    }
    expect(screen.getByRole('button', { name: 'セットを削除' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled()
  })
})
