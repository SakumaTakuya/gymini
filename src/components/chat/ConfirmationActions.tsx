import { Check } from '@phosphor-icons/react'
import { Button } from '../ui/button'

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
        <Button
          variant="secondary"
          disabled={isSettled}
          onClick={onReject}
          className="flex-1 h-11 rounded-xl font-semibold bg-gym-zinc-100 text-gym-black"
        >
          キャンセル
        </Button>
        <Button
          variant="default"
          disabled={!canApprove}
          onClick={onApprove}
          className="flex-1 h-11 rounded-xl font-bold bg-gym-black text-gym-white"
        >
          <Check size={16} weight="bold" />
          {label}
        </Button>
      </div>
      {showFillHint && (
        <p className="mt-2 text-xs text-gym-zinc-500">
          重量と回数を入力してください
        </p>
      )}
    </>
  )
}
