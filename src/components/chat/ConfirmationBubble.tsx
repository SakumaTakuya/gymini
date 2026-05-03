import { Check } from '@phosphor-icons/react'
import type { PendingAction } from '../../types/chat'
import { cn } from '../../lib/utils'

export type ConfirmationBubbleProps = {
  content: string
  pendingAction: PendingAction
  onApprove: () => void
  onReject: () => void
}

function getActionLabel(action: PendingAction): string {
  switch (action.data.actionType) {
    case 'saveWorkout':
      return '記録する'
    case 'addExercise':
      return '追加する'
    case 'addExerciseToSession':
      return '追加する'
  }
}

export function ConfirmationBubble({
  content,
  pendingAction,
  onApprove,
  onReject,
}: ConfirmationBubbleProps) {
  const isSettled = pendingAction.status !== 'pending'
  const label = getActionLabel(pendingAction)

  return (
    <div className="flex justify-start px-4 py-1">
      <div className="max-w-[88%] rounded-[18px] rounded-bl-[4px] bg-gym-white border border-gym-zinc-200 shadow-soft px-4 py-3 text-sm text-gym-black whitespace-pre-wrap break-words">
        <div className="mb-3">
          {content || pendingAction.description}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isSettled}
            onClick={onReject}
            className={cn(
              'focus-ring flex-1 h-11 rounded-xl font-semibold',
              'bg-gym-zinc-100 text-gym-black',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            キャンセル
          </button>
          <button
            type="button"
            disabled={isSettled}
            onClick={onApprove}
            className={cn(
              'focus-ring flex-1 h-11 rounded-xl font-bold',
              'bg-gym-black text-gym-white inline-flex items-center justify-center gap-1.5',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            <Check size={16} weight="bold" />
            {label}
          </button>
        </div>
        {pendingAction.status === 'approved' && (
          <p className="mt-2 text-xs text-gym-zinc-500">実行済み</p>
        )}
        {pendingAction.status === 'rejected' && (
          <p className="mt-2 text-xs text-gym-zinc-500">キャンセル済み</p>
        )}
      </div>
    </div>
  )
}
