import { Check } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'

export type ConfirmationActionsProps = {
  label: string
  canApprove: boolean
  isSettled: boolean
  onApprove: () => void
  onReject: () => void
  showFillHint?: boolean
}

export function ConfirmationActions({
  label,
  canApprove,
  isSettled,
  onApprove,
  onReject,
  showFillHint,
}: ConfirmationActionsProps) {
  return (
    <>
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
          disabled={!canApprove}
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
      {showFillHint && (
        <p className="mt-2 text-xs text-gym-zinc-500">
          重量と回数を入力してください
        </p>
      )}
    </>
  )
}
