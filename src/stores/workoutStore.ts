import { create } from 'zustand'
import type { WorkoutRecord, WorkoutExercise, WorkoutInput, PendingSet, WorkoutSet } from '../types'
import {
  listByDateDesc,
  create as repoCreateWorkout,
  update as repoUpdateWorkout,
  remove as repoRemoveWorkout,
} from '../lib/workoutRepository'

interface WorkoutState {
  workouts: WorkoutRecord[]
  draftDate: string
  draftExercises: WorkoutExercise[]
  draftMemo: string
  draftWorkoutId: string | null
}

interface WorkoutActions {
  loadWorkouts: () => void
  startSession: (date: string, editTarget?: WorkoutRecord) => void
  addExercise: (exercise: Pick<WorkoutExercise, 'exerciseId' | 'exerciseName'>) => void
  addSet: (exerciseIndex: number, pendingSet: PendingSet) => void
  /** Zustand 内部用。pendingSet 値を更新し、次の confirmSet_internal で確定する */
  updatePendingSet_internal: (exerciseIndex: number, pendingSet: PendingSet) => void
  /** Zustand 内部用。pendingSet を sets に移して次の pendingSet を初期化する */
  confirmSet_internal: (exerciseIndex: number) => void
  updateSet: (exerciseIndex: number, setIndex: number, updatedSet: WorkoutSet) => void
  removeSet: (exerciseIndex: number, setIndex: number) => void
  setDraftMemo: (memo: string) => void
  saveSession: () => void
  cancelSession: () => void
  deleteWorkout: (id: string) => void
  updateWorkout: (id: string, input: WorkoutInput) => void
}

type WorkoutStore = WorkoutState & WorkoutActions

const emptyPendingSet = (): PendingSet => ({ weight: 0, reps: 0, memo: '' })

const useWorkoutStore = create<WorkoutStore>()((set, get) => ({
  workouts: [],
  draftDate: '',
  draftExercises: [],
  draftMemo: '',
  draftWorkoutId: null,

  loadWorkouts: () => {
    set({ workouts: listByDateDesc() })
  },

  deleteWorkout: (id) => {
    repoRemoveWorkout(id)
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

  addSet: (exerciseIndex, pendingSet) => {
    get().updatePendingSet_internal(exerciseIndex, pendingSet)
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
        const confirmedSet: WorkoutSet = { ...ex.pendingSet }
        const nextPending: PendingSet = { weight: confirmedSet.weight, reps: confirmedSet.reps, memo: '' }
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
        pendingSet: emptyPendingSet(),
      })),
      memo: draftMemo,
    }
    if (draftWorkoutId === null) {
      repoCreateWorkout(input)
    } else {
      repoUpdateWorkout(draftWorkoutId, input)
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
    repoUpdateWorkout(id, input)
    set({ workouts: listByDateDesc() })
  },
}))

export default useWorkoutStore
