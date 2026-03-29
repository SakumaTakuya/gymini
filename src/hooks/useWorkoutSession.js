import useWorkoutStore from '../stores/workoutStore'
import { search as searchExercisesRepo } from '../lib/exerciseRepository'

export default function useWorkoutSession() {
  const draftDate = useWorkoutStore((s) => s.draftDate)
  const draftExercises = useWorkoutStore((s) => s.draftExercises)
  const draftMemo = useWorkoutStore((s) => s.draftMemo)
  const startSessionStore = useWorkoutStore((s) => s.startSession)
  const addExercise = useWorkoutStore((s) => s.addExercise)
  const addSet = useWorkoutStore((s) => s.addSet)
  const updateSet = useWorkoutStore((s) => s.updateSet)
  const removeSet = useWorkoutStore((s) => s.removeSet)
  const setDraftMemo = useWorkoutStore((s) => s.setDraftMemo)
  const updatePendingSet = useWorkoutStore((s) => s.updatePendingSet_internal)
  const saveSession = useWorkoutStore((s) => s.saveSession)
  const cancelSession = useWorkoutStore((s) => s.cancelSession)

  function startSession(date) {
    const d = date || new Date().toISOString().slice(0, 10)
    startSessionStore(d)
  }

  function startEditSession(workout) {
    startSessionStore(workout.date, workout)
  }

  function searchExercises(query) {
    return searchExercisesRepo(query)
  }

  return {
    draftDate,
    draftExercises,
    draftMemo,
    startSession,
    startEditSession,
    addExercise,
    addSet,
    updateSet,
    updatePendingSet,
    removeSet,
    setDraftMemo,
    saveSession,
    cancelSession,
    searchExercises,
  }
}
