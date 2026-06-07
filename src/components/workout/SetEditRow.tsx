import { type FocusEvent, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import { Input } from '../ui/input'

// Per-input data + event handlers. Refs stay as top-level props of SetEditRow
// (weightInputRef / repsInputRef) because the React Compiler-aware lint rule
// treats any object containing a Ref as ref-tainted and rejects field accesses
// on it during render — and because refs are imperative handles that React
// itself special-cases, distinct from the declarative input config bundled here.
export type SetEditRowInputProps = {
  value: number
  placeholder?: string
  onChange: (n: number) => void
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}

type SetEditRowProps = {
  setNumber: number
  weight: SetEditRowInputProps
  reps: SetEditRowInputProps
  weightInputRef?: Ref<HTMLInputElement>
  repsInputRef?: Ref<HTMLInputElement>
  trailing: ReactNode
  disabled?: boolean
  blankOnZero?: boolean
  className?: string
}

export function SetEditRow({
  setNumber,
  weight,
  reps,
  weightInputRef,
  repsInputRef,
  trailing,
  disabled = false,
  blankOnZero = false,
  className = '',
}: SetEditRowProps) {
  const weightValue = blankOnZero && weight.value === 0 ? '' : weight.value
  const repsValue = blankOnZero && reps.value === 0 ? '' : reps.value

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
          placeholder={weight.placeholder}
          onChange={(e) => weight.onChange(Number(e.target.value))}
          onBlur={weight.onBlur}
          onKeyDown={weight.onKeyDown}
          enterKeyHint="next"
          disabled={disabled}
          suffix={<span className="text-[10px] font-medium text-gym-zinc-400">kg</span>}
          containerClassName="items-baseline gap-1 h-auto pb-0.5"
          className="w-16 text-3xl font-outfit font-bold tabular-nums"
        />
        <Input
          ref={repsInputRef}
          type="number"
          value={repsValue}
          placeholder={reps.placeholder}
          onChange={(e) => reps.onChange(Number(e.target.value))}
          onBlur={reps.onBlur}
          onKeyDown={reps.onKeyDown}
          enterKeyHint="done"
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
