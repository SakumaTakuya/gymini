import { Plus, X } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { IconButton } from '../ui/icon-button'
import { SetEditRow } from '../workout/SetEditRow'

export type EditableSetRowProps = {
  setNumber: number
  weight: number
  reps: number
  isSettled: boolean
  onWeightChange: (n: number) => void
  onRepsChange: (n: number) => void
  onRemove: () => void
}

export function EditableSetRow({
  setNumber,
  weight,
  reps,
  isSettled,
  onWeightChange,
  onRepsChange,
  onRemove,
}: EditableSetRowProps) {
  return (
    <SetEditRow
      setNumber={setNumber}
      weight={weight}
      reps={reps}
      onWeightChange={onWeightChange}
      onRepsChange={onRepsChange}
      disabled={isSettled}
      blankOnZero
      weightPlaceholder="kg"
      repsPlaceholder="回"
      trailing={
        <IconButton
          onClick={onRemove}
          disabled={isSettled}
          aria-label="セットを削除"
          className="rounded text-gym-zinc-500 hover:text-gym-black"
        >
          <X size={14} weight="bold" />
        </IconButton>
      }
    />
  )
}

export type AddSetButtonProps = {
  isSettled: boolean
  onClick: () => void
}

export function AddSetButton({ isSettled, onClick }: AddSetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSettled}
      className={cn(
        'focus-ring inline-flex items-center justify-center gap-1.5',
        'h-10 px-3 rounded-xl border border-dashed border-gym-zinc-300',
        'text-xs font-semibold text-gym-zinc-600 hover:text-gym-black',
        'disabled:opacity-40 disabled:cursor-not-allowed',
      )}
    >
      <Plus size={12} weight="bold" />
      セットを追加
    </button>
  )
}
