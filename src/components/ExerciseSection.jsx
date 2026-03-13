import React from 'react'
import SetRowInput from './SetRowInput'

export default function ExerciseSection({
  exercise,
  exerciseIndex,
  onAddSet,
  onUpdateSet,
  onPendingSetChange,
  autoFocus = false,
}) {
  function handleAddSet() {
    onAddSet(exerciseIndex, exercise.pendingSet)
  }

  function handleUpdateSet(setIndex, updatedSet) {
    onUpdateSet(exerciseIndex, setIndex, updatedSet)
  }

  function handlePendingSetChange(pendingSet) {
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
