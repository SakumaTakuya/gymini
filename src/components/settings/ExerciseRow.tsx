import { PencilSimple } from '@phosphor-icons/react'
import type { Exercise } from '@/schemas/exercise'

type ExerciseRowProps = {
  exercise: Exercise
  onEdit: (exercise: Exercise) => void
}

export function ExerciseRow({ exercise, onEdit }: ExerciseRowProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="font-outfit font-semibold text-sm text-gym-black">
        {exercise.name}
      </span>
      <button
        type="button"
        onClick={() => onEdit(exercise)}
        aria-label={`${exercise.name}を編集`}
        className="focus-ring relative w-8 h-8 rounded-full bg-gym-zinc-50 flex items-center justify-center text-gym-zinc-400 before:absolute before:inset-[-8px] before:content-['']"
      >
        <PencilSimple size={14} weight="bold" />
      </button>
    </div>
  )
}
