import { PencilSimple, Trash } from '@phosphor-icons/react'
import type { Exercise } from '@/types'

type ExerciseRowProps = {
  exercise: Exercise
  onEdit: (exercise: Exercise) => void
  onDelete: (exercise: Exercise) => void
}

export function ExerciseRow({ exercise, onEdit, onDelete }: ExerciseRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-gym-zinc-100 py-2 last:border-b-0">
      <span className="font-inter text-sm text-gym-black">{exercise.name}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(exercise)}
          aria-label={`${exercise.name}を編集`}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gym-zinc-500"
        >
          <PencilSimple size={18} weight="bold" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(exercise)}
          aria-label={`${exercise.name}を削除`}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gym-accent"
        >
          <Trash size={18} weight="bold" />
        </button>
      </div>
    </div>
  )
}
