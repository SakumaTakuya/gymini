import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { nowISODateTimeString, todayDateString } from '../schemas/date'
import type { DateString, ISODateTimeString } from '../schemas/date'
import type {
  DraftExercise,
  ExerciseOrigin,
  WorkoutSet,
} from '../schemas/workout'
import * as WorkoutRepository from '../lib/workoutRepository'
import { storeBus } from './storeBus'

type WorkoutSessionState = {
  // State
  isActive: boolean
  startedAt: ISODateTimeString | null
  date: DateString | null
  draftExercises: DraftExercise[]

  // Actions
  startSession: (date?: DateString) => void
  endSession: () => void
  addExercise: (exercise: {
    exerciseId: string
    exerciseName: string
    origin?: ExerciseOrigin
  }) => void
  addExerciseWithSets: (exercise: {
    exerciseId: string
    exerciseName: string
    sets: WorkoutSet[]
    origin?: ExerciseOrigin
  }) => void
  acceptSuggestedExercise: (exerciseIndex: number) => void
  activateExercise: (exerciseIndex: number) => void
  deleteExercise: (exerciseIndex: number) => void
  reorderExercise: (exerciseIndex: number, direction: 'up' | 'down') => void
  completeSet: (exerciseIndex: number, set: WorkoutSet) => void
  editCompletedSet: (exerciseIndex: number, setIndex: number) => void
  deleteCompletedSet: (exerciseIndex: number, setIndex: number) => void
  updatePendingSet: (exerciseIndex: number, pendingSet: Partial<WorkoutSet>) => void
  toggleExerciseCard: (exerciseIndex: number) => void
}

// Restores a set being edited back into the sets array at its original index.
// If a new set was being entered (editingSetIndex === null) and the user modified
// it (pendingSetDirty), auto-appends it so the data is not lost.
// Returns the exercise with no pending state in all cases.
function restoreEditingSet(e: DraftExercise): DraftExercise {
  if (e.editingSetIndex != null && e.pendingSet !== null) {
    const i = e.editingSetIndex
    const restored = [...e.sets.slice(0, i), e.pendingSet, ...e.sets.slice(i)]
    return { ...e, sets: restored, pendingSet: null, pendingSetDirty: false, editingSetIndex: null }
  }
  if (e.pendingSetDirty && e.pendingSet !== null) {
    return { ...e, sets: [...e.sets, e.pendingSet], pendingSet: null, pendingSetDirty: false, editingSetIndex: null }
  }
  return { ...e, pendingSet: null, pendingSetDirty: false, editingSetIndex: null }
}

function deactivateRecording(exercises: DraftExercise[]): DraftExercise[] {
  return exercises.map((e) =>
    e.cardState === 'recording'
      ? { ...restoreEditingSet(e), cardState: 'idle' as const }
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
        storeBus.clearChatMessages?.()
      },

      endSession: () => {
        const { draftExercises, startedAt, date } = get()
        if (startedAt && date) {
          const now = nowISODateTimeString()
          // Restore any in-progress edit so a set being edited is not lost
          // when the user ends the session without pressing 完了.
          const finalized = draftExercises.map(restoreEditingSet)
          WorkoutRepository.save({
            date,
            exercises: finalized.map((e) => ({
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
        storeBus.clearChatMessages?.()
      },

      deleteExercise: (exerciseIndex) => {
        set((state) => ({
          draftExercises: state.draftExercises.filter((_, i) => i !== exerciseIndex),
        }))
      },

      reorderExercise: (exerciseIndex, direction) => {
        set((state) => {
          const exercises = [...state.draftExercises]
          const targetIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1
          if (targetIndex < 0 || targetIndex >= exercises.length) return state
          ;[exercises[exerciseIndex], exercises[targetIndex]] = [
            exercises[targetIndex],
            exercises[exerciseIndex],
          ]
          return { draftExercises: exercises }
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
            pendingSetDirty: false,
            cardState: 'recording',
            editingSetIndex: null,
            origin: exercise.origin ?? 'manual',
          }
          return { draftExercises: [...deactivated, newExercise] }
        })
      },

      addExerciseWithSets: (exercise) => {
        set((state) => {
          const deactivated = deactivateRecording(state.draftExercises)
          const newExercise: DraftExercise = {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            sets: exercise.sets,
            pendingSet: null,
            pendingSetDirty: false,
            cardState: 'idle',
            editingSetIndex: null,
            origin: exercise.origin ?? 'manual',
          }
          return { draftExercises: [...deactivated, newExercise] }
        })
      },

      acceptSuggestedExercise: (exerciseIndex) => {
        set((state) => {
          const target = state.draftExercises[exerciseIndex]
          if (!target || target.origin !== 'ai-suggested') return state
          const exercises = [...state.draftExercises]
          exercises[exerciseIndex] = { ...target, origin: 'manual' }
          return { draftExercises: exercises }
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
            pendingSetDirty: false,
            editingSetIndex: null,
          }
          return { draftExercises: updated }
        })
      },

      completeSet: (exerciseIndex, completedSet) => {
        set((state) => {
          const exercises = [...state.draftExercises]
          const target = exercises[exerciseIndex]
          if (!target) return state
          // If editing an existing set, reinsert at original position; otherwise append.
          const isEditMode = target.editingSetIndex != null
          const newSets = isEditMode
            ? [
                ...target.sets.slice(0, target.editingSetIndex!),
                completedSet,
                ...target.sets.slice(target.editingSetIndex!),
              ]
            : [...target.sets, completedSet]
          exercises[exerciseIndex] = {
            ...target,
            sets: newSets,
            pendingSet: { ...completedSet },
            pendingSetDirty: false,
            editingSetIndex: null,
            // Editing an existing set returns to idle; new set stays recording for next entry.
            ...(isEditMode ? { cardState: 'idle' } : {}),
          }
          return { draftExercises: exercises }
        })
      },

      editCompletedSet: (exerciseIndex, setIndex) => {
        set((state) => {
          const originalExercise = state.draftExercises[exerciseIndex]
          const deactivated = deactivateRecording(state.draftExercises)
          const exercises = [...deactivated]
          const target = exercises[exerciseIndex]
          if (!target) return state

          // After deactivateRecording restored any in-progress edit on this exercise,
          // the displayed setIndex may be off by one if the restored set was inserted
          // at or before the clicked position.
          const restoredIdx =
            originalExercise.cardState === 'recording'
              ? (originalExercise.editingSetIndex ?? null)
              : null
          const adjustedSetIndex =
            restoredIdx != null && restoredIdx <= setIndex
              ? setIndex + 1
              : setIndex

          if (adjustedSetIndex >= target.sets.length) return state
          const setToEdit = target.sets[adjustedSetIndex]
          const newSets = target.sets.filter((_, i) => i !== adjustedSetIndex)
          exercises[exerciseIndex] = {
            ...target,
            sets: newSets,
            pendingSet: { ...setToEdit },
            pendingSetDirty: false,
            cardState: 'recording',
            editingSetIndex: adjustedSetIndex,
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
            pendingSetDirty: true,
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
            // Restore any in-progress edit before collapsing so the set is not lost.
            const restored = restoreEditingSet(target)
            exercises[exerciseIndex] = {
              ...restored,
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
