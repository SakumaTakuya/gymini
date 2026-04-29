import { useWorkoutSession } from '@/hooks/useWorkoutSession'
import { ExerciseCard } from './ExerciseCard'
import { ExerciseSearchField } from './ExerciseSearchField'

export function ActiveSessionView() {
  const {
    draftExercises,
    addExercise,
    activateExercise,
    deleteExercise,
    reorderExercise,
    completeSet,
    editCompletedSet,
    deleteCompletedSet,
    toggleExerciseCard,
    updatePendingSet,
    searchExercises,
    createExercise,
  } = useWorkoutSession()

  return (
    <div className="flex-1 bg-zinc-50 pt-16 pb-32 overflow-y-auto">
      <div className="px-6 mb-6">
        <h1 className="text-2xl font-bold font-outfit">ワークアウト</h1>
      </div>

      {draftExercises.map((draft, i) => (
        <ExerciseCard
          key={`${draft.exerciseId}-${i}`}
          draftExercise={draft}
          onActivate={() => activateExercise(i)}
          onComplete={(set) => completeSet(i, set)}
          onEdit={(setIndex) => editCompletedSet(i, setIndex)}
          onDelete={(setIndex) => deleteCompletedSet(i, setIndex)}
          onDeleteExercise={() => deleteExercise(i)}
          onMoveUp={i > 0 ? () => reorderExercise(i, 'up') : undefined}
          onMoveDown={i < draftExercises.length - 1 ? () => reorderExercise(i, 'down') : undefined}
          onToggle={() => toggleExerciseCard(i)}
          onWeightChange={(weight) => updatePendingSet(i, { weight })}
          onRepsChange={(reps) => updatePendingSet(i, { reps })}
        />
      ))}

      <ExerciseSearchField
        onSelectExercise={addExercise}
        searchExercises={searchExercises}
        createExercise={createExercise}
      />
    </div>
  )
}
