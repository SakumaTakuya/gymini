import { type FocusEvent, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import { Input } from '../ui/input'

type SetEditRowProps = {
  setNumber: number
  weight: number
  reps: number
  onWeightChange: (n: number) => void
  onRepsChange: (n: number) => void
  trailing: ReactNode
  disabled?: boolean
  blankOnZero?: boolean
  weightPlaceholder?: string
  repsPlaceholder?: string
  className?: string
  weightInputRef?: Ref<HTMLInputElement>
  repsInputRef?: Ref<HTMLInputElement>
  onWeightBlur?: (e: FocusEvent<HTMLInputElement>) => void
  onWeightKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  onRepsBlur?: (e: FocusEvent<HTMLInputElement>) => void
  onRepsKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}

export function SetEditRow({
  setNumber,
  weight,
  reps,
  onWeightChange,
  onRepsChange,
  trailing,
  disabled = false,
  blankOnZero = false,
  weightPlaceholder,
  repsPlaceholder,
  className = '',
  weightInputRef,
  repsInputRef,
  onWeightBlur,
  onWeightKeyDown,
  onRepsBlur,
  onRepsKeyDown,
}: SetEditRowProps) {
  const weightValue = blankOnZero && weight === 0 ? '' : weight
  const repsValue = blankOnZero && reps === 0 ? '' : reps

  return (
    <div
      className={`group flex items-center gap-3 py-2 px-2 rounded-xl bg-gym-white shadow-soft relative overflow-hidden ${className}`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gym-black transition-colors duration-quick group-focus-within:bg-gym-accent" />
      <div className="w-6 h-6 rounded bg-gym-zinc-100 flex items-center justify-center text-gym-black ml-1">
        <span className="font-outfit font-bold text-xs">{setNumber}</span>
      </div>
      <div className="flex-1 flex gap-6">
        <Input
          ref={weightInputRef}
          type="number"
          value={weightValue}
          placeholder={weightPlaceholder}
          onChange={(e) => onWeightChange(Number(e.target.value))}
          onBlur={onWeightBlur}
          onKeyDown={onWeightKeyDown}
          inputMode="decimal"
          disabled={disabled}
          suffix={<span className="text-[10px] font-medium text-gym-zinc-400">kg</span>}
          containerClassName="items-baseline gap-1 h-auto pb-0.5"
          className="w-16 text-3xl font-outfit font-bold tabular-nums"
        />
        <Input
          ref={repsInputRef}
          type="number"
          value={repsValue}
          placeholder={repsPlaceholder}
          onChange={(e) => onRepsChange(Number(e.target.value))}
          onBlur={onRepsBlur}
          onKeyDown={onRepsKeyDown}
          inputMode="numeric"
          disabled={disabled}
          suffix={<span className="text-[10px] font-medium text-gym-zinc-400">回</span>}
          containerClassName="items-baseline gap-1 h-auto pb-0.5"
          className="w-12 text-3xl font-outfit font-bold tabular-nums"
        />
      </div>
      {trailing}
    </div>
  )
}
