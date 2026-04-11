import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkoutSessionStore } from './workoutSessionStore'
import type { DateString } from '../schemas/date'

// Reset store between tests
function resetStore() {
  useWorkoutSessionStore.setState({
    isActive: false,
    startedAt: null,
    date: null,
    draftExercises: [],
  })
}

describe('workoutSessionStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
  })

  describe('initial state', () => {
    it('has correct initial values', () => {
      const state = useWorkoutSessionStore.getState()
      expect(state.isActive).toBe(false)
      expect(state.startedAt).toBeNull()
      expect(state.draftExercises).toEqual([])
    })
  })

  describe('startSession', () => {
    it('sets isActive to true and records startedAt', () => {
      useWorkoutSessionStore.getState().startSession()
      const state = useWorkoutSessionStore.getState()
      expect(state.isActive).toBe(true)
      expect(state.startedAt).toBeTruthy()
      expect(state.draftExercises).toEqual([])
    })

    it('uses provided date when specified', () => {
      useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
      const state = useWorkoutSessionStore.getState()
      expect(state.date).toBe('2026-03-08')
    })

    it('uses today when date is not specified', () => {
      useWorkoutSessionStore.getState().startSession()
      const state = useWorkoutSessionStore.getState()
      expect(state.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('endSession', () => {
    it('saves workout and resets state', () => {
      const { startSession, addExercise, completeSet, endSession } =
        useWorkoutSessionStore.getState()

      startSession('2026-03-08' as DateString)
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      completeSet(0, { weight: 60, reps: 10 })
      endSession()

      const state = useWorkoutSessionStore.getState()
      expect(state.isActive).toBe(false)
      expect(state.startedAt).toBeNull()
      expect(state.draftExercises).toEqual([])
    })

    it('saves to WorkoutRepository', () => {
      const { startSession, addExercise, completeSet, endSession } =
        useWorkoutSessionStore.getState()

      startSession('2026-03-08' as DateString)
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      completeSet(0, { weight: 60, reps: 10 })
      endSession()

      // Check localStorage for saved workout
      const raw = localStorage.getItem('gymini:workouts')
      expect(raw).toBeTruthy()
      const workouts = JSON.parse(raw!)
      expect(workouts).toHaveLength(1)
      expect(workouts[0].exercises[0].exerciseId).toBe('bench')
      expect(workouts[0].exercises[0].sets).toEqual([{ weight: 60, reps: 10 }])
    })
  })

  describe('addExercise', () => {
    it('adds exercise in recording state with pendingSet', () => {
      useWorkoutSessionStore.getState().startSession()
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises).toHaveLength(1)
      expect(draftExercises[0].cardState).toBe('recording')
      expect(draftExercises[0].pendingSet).toEqual({ weight: 0, reps: 0 })
      expect(draftExercises[0].sets).toEqual([])
    })

    it('deactivates current recording exercise when adding new one', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].cardState).toBe('idle')
      expect(draftExercises[0].pendingSet).toBeNull()
      expect(draftExercises[1].cardState).toBe('recording')
    })
  })

  describe('activateExercise', () => {
    it('activates idle exercise to recording', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      // Add second exercise, which deactivates first
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      // Activate first exercise
      useWorkoutSessionStore.getState().activateExercise(0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].cardState).toBe('recording')
      expect(draftExercises[0].pendingSet).toEqual({ weight: 0, reps: 0 })
      expect(draftExercises[1].cardState).toBe('idle')
      expect(draftExercises[1].pendingSet).toBeNull()
    })

    it('initializes pendingSet with last completed set values', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      useWorkoutSessionStore.getState().completeSet(0, { weight: 60, reps: 10 })

      // Add second exercise (deactivates first)
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      // Reactivate first exercise
      useWorkoutSessionStore.getState().activateExercise(0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].pendingSet).toEqual({ weight: 60, reps: 10 })
    })
  })

  describe('completeSet', () => {
    it('moves pendingSet to sets and creates next pendingSet with same values', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })

      useWorkoutSessionStore
        .getState()
        .completeSet(0, { weight: 60, reps: 10 })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].sets).toEqual([{ weight: 60, reps: 10 }])
      expect(draftExercises[0].pendingSet).toEqual({ weight: 60, reps: 10 })
    })

    it('appends multiple sets', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })

      useWorkoutSessionStore
        .getState()
        .completeSet(0, { weight: 60, reps: 10 })
      useWorkoutSessionStore.getState().completeSet(0, { weight: 65, reps: 8 })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].sets).toHaveLength(2)
      expect(draftExercises[0].sets[1]).toEqual({ weight: 65, reps: 8 })
      expect(draftExercises[0].pendingSet).toEqual({ weight: 65, reps: 8 })
    })
  })

  describe('editCompletedSet', () => {
    it('moves completed set back to pendingSet for editing', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      useWorkoutSessionStore
        .getState()
        .completeSet(0, { weight: 60, reps: 10 })
      useWorkoutSessionStore.getState().completeSet(0, { weight: 65, reps: 8 })

      // Edit first set
      useWorkoutSessionStore.getState().editCompletedSet(0, 0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].sets).toHaveLength(1)
      expect(draftExercises[0].sets[0]).toEqual({ weight: 65, reps: 8 })
      expect(draftExercises[0].pendingSet).toEqual({ weight: 60, reps: 10 })
      expect(draftExercises[0].cardState).toBe('recording')
    })

    it('deactivates other recording exercises', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      useWorkoutSessionStore
        .getState()
        .completeSet(0, { weight: 60, reps: 10 })
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      // Edit set on first exercise while second is recording
      useWorkoutSessionStore.getState().editCompletedSet(0, 0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].cardState).toBe('recording')
      expect(draftExercises[1].cardState).toBe('idle')
    })
  })

  describe('deleteCompletedSet', () => {
    it('removes the specified set', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      useWorkoutSessionStore
        .getState()
        .completeSet(0, { weight: 60, reps: 10 })
      useWorkoutSessionStore.getState().completeSet(0, { weight: 65, reps: 8 })

      useWorkoutSessionStore.getState().deleteCompletedSet(0, 0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].sets).toHaveLength(1)
      expect(draftExercises[0].sets[0]).toEqual({ weight: 65, reps: 8 })
    })
  })

  describe('toggleExerciseCard', () => {
    it('collapses idle card', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      // Add second to make first idle
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      useWorkoutSessionStore.getState().toggleExerciseCard(0)
      expect(
        useWorkoutSessionStore.getState().draftExercises[0].cardState,
      ).toBe('collapsed')
    })

    it('collapses recording card', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })

      useWorkoutSessionStore.getState().toggleExerciseCard(0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].cardState).toBe('collapsed')
      expect(draftExercises[0].pendingSet).toBeNull()
    })

    it('expands collapsed card to idle', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      // Add second to make first idle, then collapse first
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })
      useWorkoutSessionStore.getState().toggleExerciseCard(0)

      // Expand
      useWorkoutSessionStore.getState().toggleExerciseCard(0)
      expect(
        useWorkoutSessionStore.getState().draftExercises[0].cardState,
      ).toBe('idle')
    })
  })
})
