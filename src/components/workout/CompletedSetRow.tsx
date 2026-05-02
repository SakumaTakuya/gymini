import { Trash, PencilSimple } from '@phosphor-icons/react'
import type { WorkoutSet } from '../../schemas/workout'

type CompletedSetRowProps = {
  set: WorkoutSet
  onEdit: () => void
  onDelete: () => void
}

export function CompletedSetRow({ set, onEdit, onDelete }: CompletedSetRowProps) {
  return (
    <div data-testid="completed-set-row" className="animate-appear flex items-center gap-3 py-2 px-2 bg-gym-zinc-50 rounded-xl">
      <button
        type="button"
        onClick={onDelete}
        aria-label="削除"
        className="focus-ring rounded-md w-6 h-6 flex items-center justify-center text-gym-zinc-300 flex-shrink-0 min-h-[44px] min-w-[44px]"
      >
        <Trash size={14} weight="bold" />
      </button>
      <div className="flex-1 flex gap-6">
        <p className="font-outfit font-semibold text-lg text-gym-black">
          {set.weight}{' '}
          <span className="text-xs font-normal text-gym-zinc-400">kg</span>
        </p>
        <p className="font-outfit font-semibold text-lg text-gym-black">
          {set.reps}{' '}
          <span className="text-xs font-normal text-gym-zinc-400">回</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label="編集"
        className="focus-ring rounded-md w-6 h-6 flex items-center justify-center text-gym-zinc-400 flex-shrink-0 min-h-[44px] min-w-[44px]"
      >
        <PencilSimple size={14} weight="bold" />
      </button>
    </div>
  )
}
