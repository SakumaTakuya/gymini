import { Trash, PencilSimple } from '@phosphor-icons/react'
import type { WorkoutSet } from '../../schemas/workout'
import { IconButton } from '../ui/icon-button'

type CompletedSetRowProps = {
  setNumber: number
  set: WorkoutSet
  onEdit: () => void
  onDelete: () => void
}

export function CompletedSetRow({ setNumber, set, onEdit, onDelete }: CompletedSetRowProps) {
  return (
    <div
      data-testid="completed-set-row"
      className="animate-pop relative overflow-hidden flex items-center gap-3 py-1.5 px-2 bg-gym-zinc-50 rounded-xl"
    >
      <span
        data-testid="completed-set-watermark"
        aria-hidden="true"
        className="absolute right-0 top-0 bottom-0 flex items-center pr-4 font-outfit font-bold text-4xl text-gym-zinc-200 pointer-events-none select-none tabular-nums"
      >
        {setNumber}
      </span>
      <IconButton
        onClick={onDelete}
        aria-label="削除"
        className="relative z-10 rounded flex-shrink-0 text-gym-zinc-300"
      >
        <Trash size={14} weight="bold" />
      </IconButton>
      <div className="relative z-10 flex-1 flex gap-6">
        <p className="font-outfit font-semibold text-xl text-gym-black tabular-nums">
          {set.weight}{' '}
          <span className="text-[10px] font-normal text-gym-zinc-400">kg</span>
        </p>
        <p className="font-outfit font-semibold text-xl text-gym-black tabular-nums">
          {set.reps}{' '}
          <span className="text-[10px] font-normal text-gym-zinc-400">回</span>
        </p>
      </div>
      <IconButton
        onClick={onEdit}
        aria-label="編集"
        className="relative z-10 rounded flex-shrink-0 text-gym-zinc-400"
      >
        <PencilSimple size={14} weight="bold" />
      </IconButton>
    </div>
  )
}
