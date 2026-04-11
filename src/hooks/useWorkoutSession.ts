import { useEffect, useState } from 'react'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import * as ExerciseRepository from '../lib/exerciseRepository'
import type { Exercise } from '../types'

export function useWorkoutSession() {
  const store = useWorkoutSessionStore()
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!store.startedAt) {
      setElapsedSeconds(0)
      return
    }

    const updateElapsed = () => {
      setElapsedSeconds(
        Math.floor(
          (Date.now() - new Date(store.startedAt!).getTime()) / 1000,
        ),
      )
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)
    return () => clearInterval(interval)
  }, [store.startedAt])

  const searchExercises = (query: string): Exercise[] => {
    return ExerciseRepository.search(query)
  }

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

    // Set management
    completeSet: store.completeSet,
    editCompletedSet: store.editCompletedSet,
    deleteCompletedSet: store.deleteCompletedSet,
    updatePendingSet: store.updatePendingSet,

    // Card state
    toggleExerciseCard: store.toggleExerciseCard,
  }
}
