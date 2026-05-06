import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmationBubble } from './ConfirmationBubble'
import type { PendingAction } from '../../types/chat'

function makePending(status: PendingAction['status'] = 'pending'): PendingAction {
  return {
    id: 'pa-1',
    type: 'addExercise',
    description: '「ベンチプレス」を追加しますか？',
    data: { actionType: 'addExercise', name: 'ベンチプレス' },
    status,
  }
}

describe('ConfirmationBubble', () => {
  it('承認前にユーザーが確認できるよう content を表示する', () => {
    render(
      <ConfirmationBubble
        content="ベンチプレス 3セット を記録しますか？"
        pendingAction={makePending()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    )
    expect(screen.getByText('ベンチプレス 3セット を記録しますか？')).toBeInTheDocument()
  })

  it('pending 状態のとき承認・キャンセルボタンが操作できる', () => {
    render(
      <ConfirmationBubble
        content=""
        pendingAction={makePending('pending')}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /追加する/ })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'キャンセル' })).not.toBeDisabled()
  })

  it('承認ボタンをタップすると onApprove が呼ばれる', async () => {
    const onApprove = vi.fn()
    const onReject = vi.fn()
    render(
      <ConfirmationBubble
        content=""
        pendingAction={makePending()}
        onApprove={onApprove}
        onReject={onReject}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /追加する/ }))
    expect(onApprove).toHaveBeenCalled()
    expect(onReject).not.toHaveBeenCalled()
  })

  it('キャンセルボタンをタップすると onReject が呼ばれる', async () => {
    const onReject = vi.fn()
    render(
      <ConfirmationBubble
        content=""
        pendingAction={makePending()}
        onApprove={vi.fn()}
        onReject={onReject}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(onReject).toHaveBeenCalled()
  })

  it('承認済みのとき両ボタンが disabled になり「実行済み」を表示する（二重実行防止）', () => {
    render(
      <ConfirmationBubble
        content=""
        pendingAction={makePending('approved')}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /追加する/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled()
    expect(screen.getByText('実行済み')).toBeInTheDocument()
  })

  it('キャンセル済みのとき両ボタンが disabled になり「キャンセル済み」を表示する（二重実行防止）', () => {
    render(
      <ConfirmationBubble
        content=""
        pendingAction={makePending('rejected')}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /追加する/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled()
    expect(screen.getByText('キャンセル済み')).toBeInTheDocument()
  })

  it('saveWorkout アクションの承認ラベルは「記録する」', () => {
    render(
      <ConfirmationBubble
        content="記録しますか？"
        pendingAction={{
          id: 'pa',
          type: 'saveWorkout',
          description: '記録しますか？',
          data: {
            actionType: 'saveWorkout',
            date: '2026-04-18' as never,
            exercises: [],
          },
          status: 'pending',
        }}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /記録する/ })).toBeInTheDocument()
  })

  it('addExercise アクションの承認ラベルは「追加する」', () => {
    render(
      <ConfirmationBubble
        content=""
        pendingAction={makePending()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /追加する/ })).toBeInTheDocument()
  })

  it('addExerciseToSession アクションの承認ラベルは「追加する」', () => {
    render(
      <ConfirmationBubble
        content="種目を追加しますか？"
        pendingAction={{
          id: 'pa',
          type: 'addExerciseToSession',
          description: '種目を追加しますか？',
          data: { actionType: 'addExerciseToSession', exerciseId: 'e1', exerciseName: 'スクワット' },
          status: 'pending',
        }}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /追加する/ })).toBeInTheDocument()
  })

  describe('saveWorkout の編集可能フォーム (FR_013)', () => {
    function makeSaveWorkoutPending(): PendingAction {
      return {
        id: 'pa-sw',
        type: 'saveWorkout',
        description: '記録しますか？',
        data: {
          actionType: 'saveWorkout',
          date: '2026-05-04' as never,
          exercises: [
            {
              exerciseName: 'ベンチプレス',
              sets: [
                { weight: 60, reps: 10 },
                { weight: 60, reps: 10 },
              ],
            },
          ],
        },
        status: 'pending',
      }
    }

    it('AI 提案値を初期値とする重量・回数 input を描画する', () => {
      render(
        <ConfirmationBubble
          content="記録しますか？"
          pendingAction={makeSaveWorkoutPending()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      const inputs = screen.getAllByRole('spinbutton')
      // 2 セット × 2 入力 = 4 input
      expect(inputs).toHaveLength(4)
      expect(inputs[0]).toHaveValue(60)
      expect(inputs[1]).toHaveValue(10)
    })

    it('種目名は表示するが編集 UI を出さない（read-only）', () => {
      render(
        <ConfirmationBubble
          content="記録しますか？"
          pendingAction={makeSaveWorkoutPending()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
      // 種目名は textbox/input ではなく表示テキスト
      expect(screen.queryByDisplayValue('ベンチプレス')).not.toBeInTheDocument()
    })

    it('重量を編集して「記録する」をクリックすると、編集後の値で onApprove が呼ばれる', async () => {
      const onApprove = vi.fn()
      render(
        <ConfirmationBubble
          content="記録しますか？"
          pendingAction={makeSaveWorkoutPending()}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      )
      const inputs = screen.getAllByRole('spinbutton')
      // 1 セット目の重量を 60 → 65 に変更
      await userEvent.clear(inputs[0])
      await userEvent.type(inputs[0], '65')
      await userEvent.click(screen.getByRole('button', { name: /記録する/ }))

      expect(onApprove).toHaveBeenCalledTimes(1)
      const editedData = onApprove.mock.calls[0][0]
      expect(editedData).toMatchObject({
        actionType: 'saveWorkout',
        date: '2026-05-04',
        exercises: [
          {
            exerciseName: 'ベンチプレス',
            sets: [
              { weight: 65, reps: 10 },
              { weight: 60, reps: 10 },
            ],
          },
        ],
      })
    })

    it('「セットを追加」ボタンで set 行が増える', async () => {
      render(
        <ConfirmationBubble
          content="記録しますか？"
          pendingAction={makeSaveWorkoutPending()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      expect(screen.getAllByRole('spinbutton')).toHaveLength(4)
      await userEvent.click(screen.getByRole('button', { name: /セットを追加/ }))
      expect(screen.getAllByRole('spinbutton')).toHaveLength(6)
    })

    it('セット削除ボタンで set 行が減る', async () => {
      render(
        <ConfirmationBubble
          content="記録しますか？"
          pendingAction={makeSaveWorkoutPending()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      expect(screen.getAllByRole('spinbutton')).toHaveLength(4)
      // セット削除ボタンは 2 つあるはず
      const removeButtons = screen.getAllByRole('button', { name: /セットを削除/ })
      expect(removeButtons.length).toBeGreaterThanOrEqual(1)
      await userEvent.click(removeButtons[0])
      expect(screen.getAllByRole('spinbutton')).toHaveLength(2)
    })

    it('セット 0 の状態では「記録する」ボタンが disabled', async () => {
      render(
        <ConfirmationBubble
          content="記録しますか？"
          pendingAction={{
            id: 'pa-sw-empty',
            type: 'saveWorkout',
            description: '記録しますか？',
            data: {
              actionType: 'saveWorkout',
              date: '2026-05-04' as never,
              exercises: [{ exerciseName: 'ベンチプレス', sets: [] }],
            },
            status: 'pending',
          }}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      expect(screen.getByRole('button', { name: /記録する/ })).toBeDisabled()
    })
  })

  describe('addExerciseToSession の編集可能フォーム (sets 付き)', () => {
    function makeAddWithSetsPending(): PendingAction {
      return {
        id: 'pa-ats',
        type: 'addExerciseToSession',
        description: 'ベンチプレスを追加しますか？',
        data: {
          actionType: 'addExerciseToSession',
          exerciseId: 'ex-1',
          exerciseName: 'ベンチプレス',
          sets: [
            { weight: 60, reps: 10 },
            { weight: 60, reps: 10 },
            { weight: 60, reps: 10 },
          ],
        },
        status: 'pending',
      }
    }

    it('sets が指定されている場合、編集可能な数値 input を描画する', () => {
      render(
        <ConfirmationBubble
          content="追加しますか？"
          pendingAction={makeAddWithSetsPending()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs).toHaveLength(6)
    })

    it('sets が指定されていない場合は input を描画しない（従来通りボタンのみ）', () => {
      render(
        <ConfirmationBubble
          content="追加しますか？"
          pendingAction={{
            id: 'pa-ats-no-sets',
            type: 'addExerciseToSession',
            description: 'スクワットを追加しますか？',
            data: {
              actionType: 'addExerciseToSession',
              exerciseId: 'ex-2',
              exerciseName: 'スクワット',
            },
            status: 'pending',
          }}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    })

    it('編集後 onApprove に編集済みの sets 付きデータが渡る', async () => {
      const onApprove = vi.fn()
      render(
        <ConfirmationBubble
          content="追加しますか？"
          pendingAction={makeAddWithSetsPending()}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      )
      const inputs = screen.getAllByRole('spinbutton')
      await userEvent.clear(inputs[0])
      await userEvent.type(inputs[0], '65')
      await userEvent.click(screen.getByRole('button', { name: /追加する/ }))

      expect(onApprove).toHaveBeenCalledTimes(1)
      const editedData = onApprove.mock.calls[0][0]
      expect(editedData).toMatchObject({
        actionType: 'addExerciseToSession',
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
        sets: [
          { weight: 65, reps: 10 },
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
        ],
      })
    })
  })

  describe('addExerciseAndLog の編集可能フォーム', () => {
    function makeAddAndLogPending(
      sets: Array<{ weight: number; reps: number }> = [{ weight: 0, reps: 0 }],
    ): PendingAction {
      return {
        id: 'pa-aal',
        type: 'addExerciseAndLog',
        description: '「ラットプルダウン」を種目マスターに追加して、記録を始めますか？',
        data: {
          actionType: 'addExerciseAndLog',
          name: 'ラットプルダウン',
          sets,
        },
        status: 'pending',
      }
    }

    it('「追加して記録する」ラベルで承認ボタンを描画する', () => {
      render(
        <ConfirmationBubble
          content="追加して記録しますか？"
          pendingAction={makeAddAndLogPending()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      expect(
        screen.getByRole('button', { name: /追加して記録する/ }),
      ).toBeInTheDocument()
    })

    it('種目名と編集可能な weight/reps input が出る', () => {
      render(
        <ConfirmationBubble
          content="追加しますか？"
          pendingAction={makeAddAndLogPending([{ weight: 50, reps: 10 }])}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      expect(screen.getByText('ラットプルダウン')).toBeInTheDocument()
      expect(screen.getAllByRole('spinbutton')).toHaveLength(2)
    })

    it('編集後 onApprove に編集済み sets 付きの addExerciseAndLog データが渡る', async () => {
      const onApprove = vi.fn()
      render(
        <ConfirmationBubble
          content="追加しますか？"
          pendingAction={makeAddAndLogPending([{ weight: 0, reps: 0 }])}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      )
      const inputs = screen.getAllByRole('spinbutton')
      await userEvent.type(inputs[0], '50')
      await userEvent.type(inputs[1], '10')
      await userEvent.click(
        screen.getByRole('button', { name: /追加して記録する/ }),
      )

      expect(onApprove).toHaveBeenCalledTimes(1)
      expect(onApprove.mock.calls[0][0]).toEqual({
        actionType: 'addExerciseAndLog',
        name: 'ラットプルダウン',
        sets: [{ weight: 50, reps: 10 }],
      })
    })

    it('weight=0/reps=0 のままだと承認ボタンが disabled になる', () => {
      render(
        <ConfirmationBubble
          content="追加しますか？"
          pendingAction={makeAddAndLogPending([{ weight: 0, reps: 0 }])}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      expect(
        screen.getByRole('button', { name: /追加して記録する/ }),
      ).toBeDisabled()
      expect(screen.getByText('重量と回数を入力してください')).toBeInTheDocument()
    })
  })

  describe('編集不要なアクション', () => {
    it('addExercise アクションでは onApprove に編集データを渡さない（undefined）', async () => {
      const onApprove = vi.fn()
      render(
        <ConfirmationBubble
          content="追加しますか？"
          pendingAction={makePending()}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      )
      await userEvent.click(screen.getByRole('button', { name: /追加する/ }))
      expect(onApprove).toHaveBeenCalledTimes(1)
      expect(onApprove.mock.calls[0][0]).toBeUndefined()
    })
  })

  describe('placeholder 提案 (FR_015) と 0/0 ガード', () => {
    function makeAddWithPlaceholderPending(): PendingAction {
      return {
        id: 'pa-ats-ph',
        type: 'addExerciseToSession',
        description: 'ダンベルプレスを追加しますか？',
        data: {
          actionType: 'addExerciseToSession',
          exerciseId: 'ex-dp',
          exerciseName: 'ダンベルプレス',
          sets: [{ weight: 0, reps: 0 }],
        },
        status: 'pending',
      }
    }

    function makeSavePlaceholderPending(): PendingAction {
      return {
        id: 'pa-sw-ph',
        type: 'saveWorkout',
        description: '記録しますか？',
        data: {
          actionType: 'saveWorkout',
          date: '2026-05-05' as never,
          exercises: [
            {
              exerciseName: 'ダンベルプレス',
              sets: [{ weight: 0, reps: 0 }],
            },
          ],
        },
        status: 'pending',
      }
    }

    it('addExerciseToSession で sets が [{0,0}] のとき、フォームが表示され input は空表示', () => {
      render(
        <ConfirmationBubble
          content="追加しますか？"
          pendingAction={makeAddWithPlaceholderPending()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs).toHaveLength(2)
      // value=0 のとき空入力で表示される
      expect(inputs[0]).toHaveValue(null)
      expect(inputs[1]).toHaveValue(null)
    })

    it('addExerciseToSession で sets が [{0,0}] のとき、placeholder（kg/回）が出る', () => {
      render(
        <ConfirmationBubble
          content="追加しますか？"
          pendingAction={makeAddWithPlaceholderPending()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs[0]).toHaveAttribute('placeholder', 'kg')
      expect(inputs[1]).toHaveAttribute('placeholder', '回')
    })

    it('全セットが 0/0 のとき「記録する/追加する」は disabled かつヒント文言が出る', () => {
      render(
        <ConfirmationBubble
          content="追加しますか？"
          pendingAction={makeAddWithPlaceholderPending()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      expect(screen.getByRole('button', { name: /追加する/ })).toBeDisabled()
      expect(screen.getByText('重量と回数を入力してください')).toBeInTheDocument()
    })

    it('weight だけ入力 (reps=0) では disabled のまま', async () => {
      render(
        <ConfirmationBubble
          content="追加しますか？"
          pendingAction={makeAddWithPlaceholderPending()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      const inputs = screen.getAllByRole('spinbutton')
      await userEvent.type(inputs[0], '60')
      expect(screen.getByRole('button', { name: /追加する/ })).toBeDisabled()
    })

    it('weight と reps を両方入力すると enabled になる', async () => {
      render(
        <ConfirmationBubble
          content="追加しますか？"
          pendingAction={makeAddWithPlaceholderPending()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      const inputs = screen.getAllByRole('spinbutton')
      await userEvent.type(inputs[0], '60')
      await userEvent.type(inputs[1], '10')
      expect(screen.getByRole('button', { name: /追加する/ })).not.toBeDisabled()
      expect(
        screen.queryByText('重量と回数を入力してください'),
      ).not.toBeInTheDocument()
    })

    it('編集後の値で onApprove が呼ばれる（0/0 ではない）', async () => {
      const onApprove = vi.fn()
      render(
        <ConfirmationBubble
          content="追加しますか？"
          pendingAction={makeAddWithPlaceholderPending()}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      )
      const inputs = screen.getAllByRole('spinbutton')
      await userEvent.type(inputs[0], '60')
      await userEvent.type(inputs[1], '10')
      await userEvent.click(screen.getByRole('button', { name: /追加する/ }))

      expect(onApprove).toHaveBeenCalledTimes(1)
      expect(onApprove.mock.calls[0][0]).toMatchObject({
        actionType: 'addExerciseToSession',
        exerciseId: 'ex-dp',
        exerciseName: 'ダンベルプレス',
        sets: [{ weight: 60, reps: 10 }],
      })
    })

    it('saveWorkout でも sets が [{0,0}] のときは disabled + ヒント表示', () => {
      render(
        <ConfirmationBubble
          content="記録しますか？"
          pendingAction={makeSavePlaceholderPending()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />,
      )
      expect(screen.getByRole('button', { name: /記録する/ })).toBeDisabled()
      expect(screen.getByText('重量と回数を入力してください')).toBeInTheDocument()
    })

    it('saveWorkout 編集後の値で onApprove が呼ばれる', async () => {
      const onApprove = vi.fn()
      render(
        <ConfirmationBubble
          content="記録しますか？"
          pendingAction={makeSavePlaceholderPending()}
          onApprove={onApprove}
          onReject={vi.fn()}
        />,
      )
      const inputs = screen.getAllByRole('spinbutton')
      await userEvent.type(inputs[0], '20')
      await userEvent.type(inputs[1], '12')
      await userEvent.click(screen.getByRole('button', { name: /記録する/ }))

      expect(onApprove).toHaveBeenCalledTimes(1)
      expect(onApprove.mock.calls[0][0]).toMatchObject({
        actionType: 'saveWorkout',
        date: '2026-05-05',
        exercises: [
          {
            exerciseName: 'ダンベルプレス',
            sets: [{ weight: 20, reps: 12 }],
          },
        ],
      })
    })
  })
})
