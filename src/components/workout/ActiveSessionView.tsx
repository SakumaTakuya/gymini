import { Clock } from '@phosphor-icons/react'
import { useWorkoutSession } from '@/hooks/useWorkoutSession'
import { formatElapsedTime } from '@/lib/formatElapsedTime'
import { ExerciseCard } from './ExerciseCard'
import { ExerciseSearchField } from './ExerciseSearchField'

export function ActiveSessionView() {
  const {
    draftExercises,
    elapsedSeconds,
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
    endSession,
  } = useWorkoutSession()

  return (
    <div className="flex-1 bg-zinc-50 pt-16 pb-32 overflow-y-auto">
      <button
        type="button"
        onClick={endSession}
        className="absolute top-12 right-16 z-30 min-h-[44px] min-w-[44px] flex items-center justify-center text-accent text-sm font-bold bg-red-50/90 backdrop-blur-sm shadow-sm px-3 py-1.5 rounded-lg focus-ring"
      >
        終了
      </button>
      <div className="absolute top-24 right-4 z-30 flex items-center gap-1 bg-white/80 backdrop-blur-sm shadow-sm border border-zinc-100 px-2 py-1 rounded-lg">
        <Clock weight="fill" size={12} className="text-accent animate-pulse" />
        <span className="font-outfit font-bold text-xs text-zinc-900">
          {formatElapsedTime(elapsedSeconds)}
        </span>
      </div>
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
