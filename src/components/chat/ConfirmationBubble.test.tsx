import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
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
  test('calls onApprove when approve button clicked', async () => {
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

  test('calls onReject when cancel button clicked', async () => {
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
    await userEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(onReject).toHaveBeenCalled()
  })

  test('disables buttons after approved', () => {
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

  test('disables buttons after rejected', () => {
    render(
      <ConfirmationBubble
        content=""
        pendingAction={makePending('rejected')}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /追加する/ })).toBeDisabled()
    expect(screen.getByText('キャンセル済み')).toBeInTheDocument()
  })

  test('uses 記録する label for saveWorkout', () => {
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

  test('uses 追加する label for addExerciseToSession', () => {
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
