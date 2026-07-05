import { PencilSimple } from '@phosphor-icons/react'
import type { Exercise } from '@/schemas/exercise'
import { categoryColor, categoryLabel } from '@/lib/exerciseCategory'

type ExerciseRowProps = {
  exercise: Exercise
  onEdit: (exercise: Exercise) => void
}

export function ExerciseRow({ exercise, onEdit }: ExerciseRowProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="flex items-center gap-2 min-w-0">
        <span
          data-testid="exercise-category-dot"
          aria-hidden
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: categoryColor(exercise.category) }}
        />
        <span className="font-outfit font-semibold text-sm text-gym-black truncate">
          {exercise.name}
        </span>
        <span className="font-jp text-[10px] font-bold text-gym-zinc-400 flex-shrink-0">
          {categoryLabel(exercise.category)}
        </span>
      </span>
      <button
        type="button"
        onClick={() => onEdit(exercise)}
        aria-label={`${exercise.name}を編集`}
        className="focus-ring relative w-8 h-8 rounded-full bg-gym-zinc-50 flex items-center justify-center text-gym-zinc-400 before:absolute before:inset-[-8px] before:content-[''] flex-shrink-0"
      >
        <PencilSimple size={14} weight="bold" />
      </button>
    </div>
  )
}
