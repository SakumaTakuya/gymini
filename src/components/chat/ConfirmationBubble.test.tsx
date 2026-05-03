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
  it('承認前にユーザーが確認できるよう content を表示する（B-002）', () => {
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

  it('pending 状態のとき承認・キャンセルボタンが操作できる（B-002）', () => {
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
})
