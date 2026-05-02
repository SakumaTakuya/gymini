import { Plus } from '@phosphor-icons/react'
import { type FocusEvent, type KeyboardEvent, useRef } from 'react'

type PendingSetRowProps = {
  setNumber: number
  pendingSet: { weight: number; reps: number }
  onComplete: () => void
  onWeightChange: (weight: number) => void
  onRepsChange: (reps: number) => void
}

export function PendingSetRow({
  setNumber,
  pendingSet,
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
    <div className="flex items-center gap-3 py-2 px-2 rounded-xl border border-zinc-200 bg-white shadow-sm relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-black" />
      <div className="w-6 h-6 rounded bg-zinc-100 flex items-center justify-center text-black ml-1">
        <span className="font-outfit font-bold text-xs">{setNumber}</span>
      </div>
      <div className="flex-1 flex gap-6">
        <div className="flex items-baseline gap-1 border-b border-zinc-300 pb-0.5">
          <input
            type="number"
            value={pendingSet.weight}
            onChange={(e) => onWeightChange(Number(e.target.value))}
            onBlur={handleWeightBlur}
            onKeyDown={handleWeightKeyDown}
            className="w-10 text-xl font-outfit font-bold bg-transparent outline-none text-black"
            inputMode="decimal"
          />
          <span className="text-xs font-medium text-zinc-400">kg</span>
        </div>
        <div className="flex items-baseline gap-1 border-b border-zinc-300 pb-0.5">
          <input
            ref={repsRef}
            type="number"
            value={pendingSet.reps}
            onChange={(e) => onRepsChange(Number(e.target.value))}
            onBlur={handleRepsBlur}
            onKeyDown={handleRepsKeyDown}
            className="w-8 text-xl font-outfit font-bold bg-transparent outline-none text-black"
            inputMode="numeric"
          />
          <span className="text-xs font-medium text-zinc-400">回</span>
        </div>
      </div>
      <button
        ref={completeButtonRef}
        type="button"
        onPointerDown={() => { buttonPressedRef.current = true }}
        onClick={onComplete}
        aria-label="完了"
        className="focus-ring w-7 h-7 rounded bg-black text-white flex items-center justify-center shadow-md min-h-[44px] min-w-[44px]"
      >
        <Plus size={12} weight="bold" />
      </button>
    </div>
  )
}
