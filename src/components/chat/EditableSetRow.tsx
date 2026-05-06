import { Plus, X } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { IconButton } from '../ui/icon-button'
import { Input } from '../ui/input'

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
    <div className="flex items-center gap-3 py-2 px-2 rounded-xl border border-gym-zinc-200 bg-gym-white shadow-soft relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gym-black" />
      <div className="w-6 h-6 rounded bg-gym-zinc-100 flex items-center justify-center text-gym-black ml-1">
        <span className="font-outfit font-bold text-xs">{setNumber}</span>
      </div>
      <div className="flex-1 flex gap-6">
        <Input
          type="number"
          value={weight === 0 ? '' : weight}
          placeholder="kg"
          onChange={(e) => onWeightChange(Number(e.target.value))}
          inputMode="decimal"
          disabled={isSettled}
          suffix={<span className="text-xs font-medium text-gym-zinc-400">kg</span>}
          containerClassName="items-baseline gap-1 h-auto pb-0.5"
          className="w-12 text-xl font-outfit font-bold"
        />
        <Input
          type="number"
          value={reps === 0 ? '' : reps}
          placeholder="回"
          onChange={(e) => onRepsChange(Number(e.target.value))}
          inputMode="numeric"
          disabled={isSettled}
          suffix={<span className="text-xs font-medium text-gym-zinc-400">回</span>}
          containerClassName="items-baseline gap-1 h-auto pb-0.5"
          className="w-10 text-xl font-outfit font-bold"
        />
      </div>
      <IconButton
        onClick={onRemove}
        disabled={isSettled}
        aria-label="セットを削除"
        className="rounded text-gym-zinc-500 hover:text-gym-black"
      >
        <X size={14} weight="bold" />
      </IconButton>
    </div>
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
