import { useEffect, useState } from 'react'
import { useWorkoutSessionStore } from '@/stores/workoutSessionStore'
import { useExercises } from '@/hooks/useExercises'

function calcElapsed(startedAt: string | null): number {
  if (!startedAt) return 0
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
}

export function useWorkoutSession() {
  const store = useWorkoutSessionStore()
  const { search: searchExercises, create: createExercise } = useExercises()
  const startedAt = store.startedAt
  const [elapsedSeconds, setElapsedSeconds] = useState(() => calcElapsed(startedAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(calcElapsed(startedAt))
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  return {
    // State
    isActive: store.isActive,
    startedAt: store.startedAt,
    draftExercises: store.draftExercises,
    elapsedSeconds,

    // Session lifecycle
    startSession: store.startSession,
    endSession: store.endSession,

    // Exercise management
    addExercise: store.addExercise,
    activateExercise: store.activateExercise,
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
