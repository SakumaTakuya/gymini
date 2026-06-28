import { Check, Plus } from '@phosphor-icons/react'
import { type KeyboardEvent, useRef } from 'react'
import { IconButton } from '../ui/icon-button'
import { tactileVibrate, HAPTIC_SET_COMPLETE_MS } from '@/lib/haptic'
import { useAppear } from '@/hooks/useAppear'
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

  const handleRepsKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (pendingSet.reps > 0) completeWithHaptic()
    }
  }

  const appear = useAppear()

  return (
    <SetEditRow
      className={appear.className}
      setNumber={setNumber}
      blankOnZero
      weight={{
        value: pendingSet.weight,
        placeholder: '0',
        onChange: onWeightChange,
        onBlur: handleWeightBlur,
        onKeyDown: handleWeightKeyDown,
      }}
      reps={{
        value: pendingSet.reps,
        placeholder: '0',
        onChange: onRepsChange,
        onKeyDown: handleRepsKeyDown,
      }}
      repsInputRef={repsRef}
      trailing={
        <IconButton
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
