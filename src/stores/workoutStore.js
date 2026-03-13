import { create } from 'zustand'
import {
  listByDateDesc,
  create as createWorkout,
  update as updateWorkout,
  remove as removeWorkout,
} from '../lib/workoutRepository'

const emptyPendingSet = () => ({ weight: 0, reps: 0, memo: '' })

const useWorkoutStore = create((set, get) => ({
  workouts: [],
  draftDate: '',
  draftExercises: [],
  draftMemo: '',
  draftWorkoutId: null,

  loadWorkouts: () => {
    set({ workouts: listByDateDesc() })
  },

  deleteWorkout: (id) => {
    removeWorkout(id)
    set({ workouts: listByDateDesc() })
  },

  startSession: (date, existingWorkout) => {
    if (existingWorkout) {
      set({
        draftDate: date,
        draftWorkoutId: existingWorkout.id,
        draftExercises: existingWorkout.exercises.map((ex) => ({
          ...ex,
          pendingSet: emptyPendingSet(),
        })),
        draftMemo: existingWorkout.memo || '',
      })
    } else {
      set({
        draftDate: date,
        draftWorkoutId: null,
        draftExercises: [],
        draftMemo: '',
      })
    }
  },

  addExercise: (exercise) => {
    set((state) => ({
      draftExercises: [
        ...state.draftExercises,
        { ...exercise, sets: [], pendingSet: emptyPendingSet() },
      ],
    }))
  },

  addSet: (exerciseIndex, set) => {
    get().updatePendingSet_internal(exerciseIndex, set)
    get().confirmSet_internal(exerciseIndex)
  },

  // Internal: update pendingSet value before confirming
  updatePendingSet_internal: (exerciseIndex, pendingSet) => {
    set((state) => {
      const exercises = state.draftExercises.map((ex, i) =>
        i === exerciseIndex ? { ...ex, pendingSet } : ex
      )
      return { draftExercises: exercises }
    })
  },

  // Internal: move pendingSet to sets, init next pendingSet from confirmed
  confirmSet_internal: (exerciseIndex) => {
    set((state) => {
      const exercises = state.draftExercises.map((ex, i) => {
        if (i !== exerciseIndex) return ex
        const confirmedSet = { ...ex.pendingSet }
        const nextPending = { weight: confirmedSet.weight, reps: confirmedSet.reps, memo: '' }
        return { ...ex, sets: [...ex.sets, confirmedSet], pendingSet: nextPending }
      })
      return { draftExercises: exercises }
    })
  },

  updateSet: (exerciseIndex, setIndex, updatedSet) => {
    set((state) => {
      const exercises = state.draftExercises.map((ex, i) => {
        if (i !== exerciseIndex) return ex
        const sets = ex.sets.map((s, si) => (si === setIndex ? updatedSet : s))
        return { ...ex, sets }
      })
      return { draftExercises: exercises }
    })
  },

  removeSet: (exerciseIndex, setIndex) => {
    set((state) => {
      const exercises = state.draftExercises.map((ex, i) => {
        if (i !== exerciseIndex) return ex
        return { ...ex, sets: ex.sets.filter((_, si) => si !== setIndex) }
      })
      return { draftExercises: exercises }
    })
  },

  setDraftMemo: (memo) => set({ draftMemo: memo }),

  saveSession: () => {
    const { draftDate, draftExercises, draftMemo, draftWorkoutId } = get()
    const input = {
      date: draftDate,
      exercises: draftExercises.map(({ exerciseId, exerciseName, sets }) => ({
        exerciseId,
        exerciseName,
        sets,
      })),
      memo: draftMemo,
    }
    if (draftWorkoutId === null) {
      createWorkout(input)
    } else {
      updateWorkout(draftWorkoutId, input)
    }
    set({ draftWorkoutId: null, workouts: listByDateDesc() })
  },

  cancelSession: () => {
    set({
      draftDate: '',
      draftExercises: [],
      draftMemo: '',
      draftWorkoutId: null,
    })
  },

  updateWorkout: (id, input) => {
    updateWorkout(id, input)
    set({ workouts: listByDateDesc() })
  },
}))

export default useWorkoutStore
