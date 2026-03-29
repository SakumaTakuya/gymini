import useWorkoutStore from '../stores/workoutStore'
import { search as searchExercisesRepo } from '../lib/exerciseRepository'
import type { WorkoutRecord, Exercise } from '../types'

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

  function startSession(date?: string): void {
    const d = date || new Date().toISOString().slice(0, 10)
    startSessionStore(d)
  }

  function startEditSession(workout: WorkoutRecord): void {
    startSessionStore(workout.date, workout)
  }

  function searchExercises(query: string): Exercise[] {
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
