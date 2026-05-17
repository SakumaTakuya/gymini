import { Trash, PencilSimple } from '@phosphor-icons/react'
import type { WorkoutSet } from '../../schemas/workout'
import { IconButton } from '../ui/icon-button'

type CompletedSetRowProps = {
  set: WorkoutSet
  onEdit: () => void
  onDelete: () => void
}

export function CompletedSetRow({ set, onEdit, onDelete }: CompletedSetRowProps) {
  return (
    <div data-testid="completed-set-row" className="animate-pop flex items-center gap-3 py-2 px-2 bg-gym-zinc-50 rounded-xl">
      <IconButton
        onClick={onDelete}
        aria-label="削除"
        className="rounded flex-shrink-0 text-gym-zinc-300"
      >
        <Trash size={14} weight="bold" />
      </IconButton>
      <div className="flex-1 flex gap-6">
        <p className="font-outfit font-semibold text-2xl text-gym-black tabular-nums">
          {set.weight}{' '}
          <span className="text-[10px] font-normal text-gym-zinc-400">kg</span>
        </p>
        <p className="font-outfit font-semibold text-2xl text-gym-black tabular-nums">
          {set.reps}{' '}
          <span className="text-[10px] font-normal text-gym-zinc-400">回</span>
        </p>
      </div>
      <IconButton
        onClick={onEdit}
        aria-label="編集"
        className="rounded flex-shrink-0 text-gym-zinc-400"
      >
        <PencilSimple size={14} weight="bold" />
      </IconButton>
    </div>
  )
}
