import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { SaveWorkoutEditor } from './SaveWorkoutEditor'

// コンテナ非依存の単体テスト: props のみで動作し、chat 文脈の型/store には依存しない。

describe('SaveWorkoutEditor', () => {
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
    // 60/10 が複製されるので合計 4 inputs
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
    const { container } = render(
      <SaveWorkoutEditor {...baseProps} isSettled={true} />,
    )
    for (const input of within(container).getAllByRole('spinbutton')) {
      expect(input).toBeDisabled()
    }
    for (const button of within(container).getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })
})
