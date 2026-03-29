import type { WorkoutExercise, PendingSet, WorkoutSet } from '../types'
import SetRowInput from './SetRowInput'

interface ExerciseSectionProps {
  exercise: WorkoutExercise
  exerciseIndex: number
  onAddSet: (exerciseIndex: number, pendingSet: PendingSet) => void
  onUpdateSet: (exerciseIndex: number, setIndex: number, updatedSet: WorkoutSet) => void
  onPendingSetChange: (exerciseIndex: number, pendingSet: PendingSet) => void
  autoFocus?: boolean
}

export default function ExerciseSection({
  exercise,
  exerciseIndex,
  onAddSet,
  onUpdateSet,
  onPendingSetChange,
  autoFocus = false,
}: ExerciseSectionProps) {
  function handleAddSet() {
    onAddSet(exerciseIndex, exercise.pendingSet)
  }

  function handleUpdateSet(setIndex: number, updatedSet: WorkoutSet) {
    onUpdateSet(exerciseIndex, setIndex, updatedSet)
  }

  function handlePendingSetChange(pendingSet: PendingSet) {
    onPendingSetChange(exerciseIndex, pendingSet)
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-outfit font-bold text-base">{exercise.exerciseName}</h3>
      <SetRowInput
        pendingSet={exercise.pendingSet}
        onPendingSetChange={handlePendingSetChange}
        onAddSet={handleAddSet}
        autoFocus={autoFocus}
        confirmedSets={exercise.sets}
        onUpdateSet={handleUpdateSet}
      />
      <button
        className="h-[52px] rounded-2xl bg-zinc-100 text-black font-outfit font-bold text-base px-6"
        onClick={handleAddSet}
      >
        セット追加
      </button>
    </div>
  )
}
