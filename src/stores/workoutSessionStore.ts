import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { nowISODateTimeString, todayDateString } from '../schemas/date'
import type { DateString, ISODateTimeString } from '../schemas/date'
import type { DraftExercise, WorkoutSet } from '../schemas/workout'
import * as WorkoutRepository from '../lib/workoutRepository'

type WorkoutSessionState = {
  // State
  isActive: boolean
  startedAt: ISODateTimeString | null
  date: DateString | null
  draftExercises: DraftExercise[]

  // Actions
  startSession: (date?: DateString) => void
  endSession: () => void
  addExercise: (exercise: { exerciseId: string; exerciseName: string }) => void
  activateExercise: (exerciseIndex: number) => void
  completeSet: (exerciseIndex: number, set: WorkoutSet) => void
  editCompletedSet: (exerciseIndex: number, setIndex: number) => void
  deleteCompletedSet: (exerciseIndex: number, setIndex: number) => void
  updatePendingSet: (exerciseIndex: number, pendingSet: Partial<WorkoutSet>) => void
  toggleExerciseCard: (exerciseIndex: number) => void
}

function deactivateRecording(exercises: DraftExercise[]): DraftExercise[] {
  return exercises.map((e) =>
    e.cardState === 'recording'
      ? { ...e, cardState: 'idle' as const, pendingSet: null }
      : e,
  )
}

export const useWorkoutSessionStore = create<WorkoutSessionState>()(
  persist(
    (set, get) => ({
      isActive: false,
      startedAt: null,
      date: null,
      draftExercises: [],

      startSession: (date?: DateString) => {
        set({
          isActive: true,
          startedAt: nowISODateTimeString(),
          date: date ?? todayDateString(),
          draftExercises: [],
        })
      },

      endSession: () => {
        const { draftExercises, startedAt, date } = get()
        if (startedAt && date) {
          const now = nowISODateTimeString()
          WorkoutRepository.save({
            date,
            exercises: draftExercises.map((e) => ({
              exerciseId: e.exerciseId,
              exerciseName: e.exerciseName,
              sets: e.sets,
            })),
            startedAt,
            endedAt: now,
          })
        }
        set({
          isActive: false,
          startedAt: null,
          date: null,
          draftExercises: [],
        })
      },

      addExercise: (exercise) => {
        set((state) => {
          const deactivated = deactivateRecording(state.draftExercises)
          const newExercise: DraftExercise = {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            sets: [],
            pendingSet: { weight: 0, reps: 0 },
            cardState: 'recording',
          }
          return { draftExercises: [...deactivated, newExercise] }
        })
      },

      activateExercise: (exerciseIndex) => {
        set((state) => {
          const deactivated = deactivateRecording(state.draftExercises)
          const target = deactivated[exerciseIndex]
          if (!target || target.cardState === 'recording') return state
          const lastSet =
            target.sets.length > 0
              ? target.sets[target.sets.length - 1]
              : { weight: 0, reps: 0 }
          const updated = [...deactivated]
          updated[exerciseIndex] = {
            ...target,
            cardState: 'recording',
            pendingSet: { ...lastSet },
          }
          return { draftExercises: updated }
        })
      },

      completeSet: (exerciseIndex, completedSet) => {
        set((state) => {
          const exercises = [...state.draftExercises]
          const target = exercises[exerciseIndex]
          if (!target) return state
          exercises[exerciseIndex] = {
            ...target,
            sets: [...target.sets, completedSet],
            pendingSet: { ...completedSet },
          }
          return { draftExercises: exercises }
        })
      },

      editCompletedSet: (exerciseIndex, setIndex) => {
        set((state) => {
          const deactivated = deactivateRecording(state.draftExercises)
          const exercises = [...deactivated]
          const target = exercises[exerciseIndex]
          if (!target || setIndex >= target.sets.length) return state
          const setToEdit = target.sets[setIndex]
          const newSets = target.sets.filter((_, i) => i !== setIndex)
          exercises[exerciseIndex] = {
            ...target,
            sets: newSets,
            pendingSet: { ...setToEdit },
            cardState: 'recording',
          }
          return { draftExercises: exercises }
        })
      },

      deleteCompletedSet: (exerciseIndex, setIndex) => {
        set((state) => {
          const exercises = [...state.draftExercises]
          const target = exercises[exerciseIndex]
          if (!target || setIndex >= target.sets.length) return state
          exercises[exerciseIndex] = {
            ...target,
            sets: target.sets.filter((_, i) => i !== setIndex),
          }
          return { draftExercises: exercises }
        })
      },

      updatePendingSet: (exerciseIndex: number, pendingSet: Partial<WorkoutSet>) => {
        set((state) => {
          const exercises = [...state.draftExercises]
          const target = exercises[exerciseIndex]
          if (!target || !target.pendingSet) return state
          exercises[exerciseIndex] = {
            ...target,
            pendingSet: { ...target.pendingSet, ...pendingSet },
          }
          return { draftExercises: exercises }
        })
      },

      toggleExerciseCard: (exerciseIndex) => {
        set((state) => {
          const exercises = [...state.draftExercises]
          const target = exercises[exerciseIndex]
          if (!target) return state
          if (target.cardState === 'collapsed') {
            exercises[exerciseIndex] = { ...target, cardState: 'idle' }
          } else {
            exercises[exerciseIndex] = {
              ...target,
              cardState: 'collapsed',
              pendingSet: null,
            }
          }
          return { draftExercises: exercises }
        })
      },
    }),
    {
      name: 'gymini:workout-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isActive: state.isActive,
        startedAt: state.startedAt,
        date: state.date,
        draftExercises: state.draftExercises,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn(
            '[gymini] workoutSessionStore rehydration failed, using defaults',
            error,
          )
        }
      },
    },
  ),
)
