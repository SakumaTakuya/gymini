import { X } from '@phosphor-icons/react'
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

