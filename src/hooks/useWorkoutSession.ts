import { useWorkoutSessionStore } from '@/stores/workoutSessionStore'
import { useExercises } from '@/hooks/useExercises'

// 経過秒数のティッカーは useElapsedSeconds に分離した。ここに置くと
// このフックの全消費者（ActiveSessionView 含む）が毎秒再レンダーされるため。
export function useWorkoutSession() {
  const store = useWorkoutSessionStore()
  const { search: searchExercises, create: createExercise } = useExercises()

  return {
    // State
    isActive: store.isActive,
    startedAt: store.startedAt,
    draftExercises: store.draftExercises,

    // Session lifecycle
    startSession: store.startSession,
    endSession: store.endSession,

    // Exercise management
    addExercise: store.addExercise,
    activateExercise: store.activateExercise,
    deleteExercise: store.deleteExercise,
    reorderExercise: store.reorderExercise,
    searchExercises,
    createExercise,

    // Set management
    completeSet: store.completeSet,
    editCompletedSet: store.editCompletedSet,
    deleteCompletedSet: store.deleteCompletedSet,
    updatePendingSet: store.updatePendingSet,

    // Card state
    toggleExerciseCard: store.toggleExerciseCard,
  }
}
