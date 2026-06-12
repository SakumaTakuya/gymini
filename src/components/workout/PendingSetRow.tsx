import { Check, Plus } from '@phosphor-icons/react'
import { type FocusEvent, type KeyboardEvent, useRef } from 'react'
import { IconButton } from '../ui/icon-button'
import { tactileVibrate, HAPTIC_SET_COMPLETE_MS } from '@/lib/haptic'
import { SetEditRow } from './SetEditRow'

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

  const completeWithHaptic = () => {
    tactileVibrate(HAPTIC_SET_COMPLETE_MS)
    onComplete()
  }

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
    if (pendingSet.reps > 0) completeWithHaptic()
  }

  const handleRepsKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (pendingSet.reps > 0) completeWithHaptic()
    }
  }

  return (
    <SetEditRow
      className="animate-appear"
      setNumber={setNumber}
      weight={{
        value: pendingSet.weight,
        onChange: onWeightChange,
        onBlur: handleWeightBlur,
        onKeyDown: handleWeightKeyDown,
      }}
      reps={{
        value: pendingSet.reps,
        onChange: onRepsChange,
        onBlur: handleRepsBlur,
        onKeyDown: handleRepsKeyDown,
      }}
      repsInputRef={repsRef}
      trailing={
        <IconButton
          ref={completeButtonRef}
          onPointerDown={() => { buttonPressedRef.current = true }}
          onClick={completeWithHaptic}
          aria-label="完了"
          className="rounded bg-gym-black text-gym-white shadow-soft hover:bg-gym-black/90"
        >
          {isEditing ? <Check size={12} weight="bold" /> : <Plus size={12} weight="bold" />}
        </IconButton>
      }
    />
  )
}
