import { Check, Plus } from '@phosphor-icons/react'
import { type FocusEvent, type KeyboardEvent, useRef } from 'react'
import { IconButton } from '../ui/icon-button'
import { Input } from '../ui/input'

type PendingSetRowProps = {
  setNumber: number
  pendingSet: { weight: number; reps: number }
  isEditing?: boolean
  onComplete: () => void
  onWeightChange: (weight: number) => void
  onRepsChange: (reps: number) => void
}

export function PendingSetRow({
  setNumber,
  pendingSet,
  isEditing = false,
  onComplete,
  onWeightChange,
  onRepsChange,
}: PendingSetRowProps) {
  const repsRef = useRef<HTMLInputElement>(null)
  const completeButtonRef = useRef<HTMLButtonElement>(null)
  // Set to true on button pointerdown to suppress the reps blur auto-complete
  // that would otherwise fire simultaneously with the button click.
  const buttonPressedRef = useRef(false)

  const handleWeightBlur = () => {
    repsRef.current?.focus()
  }

  const handleWeightKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      repsRef.current?.focus()
    }
  }

  const handleRepsBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (e.relatedTarget === completeButtonRef.current) return
    if (buttonPressedRef.current) {
      buttonPressedRef.current = false
      return
    }
    if (pendingSet.reps > 0) onComplete()
  }

  const handleRepsKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (pendingSet.reps > 0) onComplete()
    }
  }

  return (
    <div className="animate-appear flex items-center gap-3 py-2 px-2 rounded-xl border border-gym-zinc-200 bg-gym-white shadow-soft relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gym-black" />
      <div className="w-6 h-6 rounded bg-gym-zinc-100 flex items-center justify-center text-gym-black ml-1">
        <span className="font-outfit font-bold text-xs">{setNumber}</span>
      </div>
      <div className="flex-1 flex gap-6">
        <Input
          type="number"
          value={pendingSet.weight}
          onChange={(e) => onWeightChange(Number(e.target.value))}
          onBlur={handleWeightBlur}
          onKeyDown={handleWeightKeyDown}
          inputMode="decimal"
          suffix={<span className="text-xs font-medium text-gym-zinc-400">kg</span>}
          containerClassName="items-baseline gap-1 h-auto pb-0.5"
          className="w-10 text-xl font-outfit font-bold"
        />
        <Input
          ref={repsRef}
          type="number"
          value={pendingSet.reps}
          onChange={(e) => onRepsChange(Number(e.target.value))}
          onBlur={handleRepsBlur}
          onKeyDown={handleRepsKeyDown}
          inputMode="numeric"
          suffix={<span className="text-xs font-medium text-gym-zinc-400">回</span>}
          containerClassName="items-baseline gap-1 h-auto pb-0.5"
          className="w-8 text-xl font-outfit font-bold"
        />
      </div>
      <IconButton
        ref={completeButtonRef}
        onPointerDown={() => { buttonPressedRef.current = true }}
        onClick={onComplete}
        aria-label="完了"
        className="rounded bg-gym-black text-gym-white shadow-soft hover:bg-gym-black/90"
      >
        {isEditing ? <Check size={12} weight="bold" /> : <Plus size={12} weight="bold" />}
      </IconButton>
    </div>
  )
}
