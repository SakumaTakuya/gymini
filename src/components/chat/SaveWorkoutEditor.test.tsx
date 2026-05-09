import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SaveWorkoutEditor } from './SaveWorkoutEditor'

describe('SaveWorkoutEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseProps = {
    initialExercises: [
      {
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 60, reps: 10 }],
      },
    ],
    isSettled: false,
    label: '記録する',
    onApprove: vi.fn(),
    onReject: vi.fn(),
  }

  it('初期 exercises と sets を表示する', () => {
    render(<SaveWorkoutEditor {...baseProps} />)
    expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
    expect(screen.getByDisplayValue('60')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
  })

  it('複数 exercises を表示する', () => {
    render(
      <SaveWorkoutEditor
        {...baseProps}
        initialExercises={[
          { exerciseName: 'ベンチプレス', sets: [{ weight: 60, reps: 10 }] },
          { exerciseName: 'スクワット', sets: [{ weight: 100, reps: 5 }] },
        ]}
      />,
    )
    expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
    expect(screen.getByText('スクワット')).toBeInTheDocument()
  })

  it('セット追加ボタンで該当 exercise の sets が増える', () => {
    render(<SaveWorkoutEditor {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /セットを追加/ }))
    expect(screen.getAllByRole('spinbutton')).toHaveLength(4)
  })

  it('全セット入力済みなら onApprove に最新 exercises を渡す', () => {
    const onApprove = vi.fn()
    render(<SaveWorkoutEditor {...baseProps} onApprove={onApprove} />)
    fireEvent.click(screen.getByRole('button', { name: /記録する/ }))
    expect(onApprove).toHaveBeenCalledWith([
      {
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 60, reps: 10 }],
      },
    ])
  })

  it('未入力 set があれば承認ボタンが disabled でヒントが出る', () => {
    render(
      <SaveWorkoutEditor
        {...baseProps}
        initialExercises={[
          {
            exerciseName: 'ベンチプレス',
            sets: [{ weight: 0, reps: 0 }],
          },
        ]}
      />,
    )
    expect(screen.getByRole('button', { name: /記録する/ })).toBeDisabled()
    expect(screen.getByText('重量と回数を入力してください')).toBeInTheDocument()
  })

  it('sets が 0 件のとき承認ボタンが disabled だがヒントは出ない', () => {
    render(
      <SaveWorkoutEditor
        {...baseProps}
        initialExercises={[{ exerciseName: 'ベンチプレス', sets: [] }]}
      />,
    )
    expect(screen.getByRole('button', { name: /記録する/ })).toBeDisabled()
    expect(screen.queryByText('重量と回数を入力してください')).not.toBeInTheDocument()
  })

  it('weight 入力で内部 state が更新され、onApprove に反映される', () => {
    const onApprove = vi.fn()
    render(<SaveWorkoutEditor {...baseProps} onApprove={onApprove} />)
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '70' } })
    fireEvent.click(screen.getByRole('button', { name: /記録する/ }))
    expect(onApprove).toHaveBeenCalledWith([
      {
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 70, reps: 10 }],
      },
    ])
  })

  it('セット削除で onApprove に反映される', () => {
    const onApprove = vi.fn()
    render(
      <SaveWorkoutEditor
        {...baseProps}
        initialExercises={[
          {
            exerciseName: 'ベンチプレス',
            sets: [
              { weight: 60, reps: 10 },
              { weight: 65, reps: 8 },
            ],
          },
        ]}
        onApprove={onApprove}
      />,
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'セットを削除' })[0])
    fireEvent.click(screen.getByRole('button', { name: /記録する/ }))
    expect(onApprove).toHaveBeenCalledWith([
      {
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 65, reps: 8 }],
      },
    ])
  })

  it('キャンセルで onReject を呼ぶ', () => {
    const onReject = vi.fn()
    render(<SaveWorkoutEditor {...baseProps} onReject={onReject} />)
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(onReject).toHaveBeenCalledOnce()
  })

  it('isSettled=true のとき全 disabled', () => {
    render(<SaveWorkoutEditor {...baseProps} isSettled={true} />)
    for (const input of screen.getAllByRole('spinbutton')) {
      expect(input).toBeDisabled()
    }
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })
})
