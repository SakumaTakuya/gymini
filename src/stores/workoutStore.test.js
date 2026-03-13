import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import useWorkoutStore from './workoutStore'

beforeEach(() => {
  localStorage.clear()
  act(() => {
    useWorkoutStore.setState({
      workouts: [],
      draftDate: '',
      draftExercises: [],
      draftMemo: '',
      draftWorkoutId: null,
    })
  })
})

describe('loadWorkouts', () => {
  it('loads workouts into state', () => {
    const { create } = require('../lib/workoutRepository')
    const w = create({ date: '2026-03-08', exercises: [] })
    act(() => useWorkoutStore.getState().loadWorkouts())
    expect(useWorkoutStore.getState().workouts).toHaveLength(1)
    expect(useWorkoutStore.getState().workouts[0].id).toBe(w.id)
  })
})

describe('deleteWorkout', () => {
  it('removes workout from state and storage', () => {
    const { create } = require('../lib/workoutRepository')
    const w = create({ date: '2026-03-08', exercises: [] })
    act(() => useWorkoutStore.getState().loadWorkouts())
    act(() => useWorkoutStore.getState().deleteWorkout(w.id))
    expect(useWorkoutStore.getState().workouts).toHaveLength(0)
  })
})

describe('startSession', () => {
  it('sets draftDate and clears draftWorkoutId for new session', () => {
    act(() => useWorkoutStore.getState().startSession('2026-03-08'))
    const state = useWorkoutStore.getState()
    expect(state.draftDate).toBe('2026-03-08')
    expect(state.draftWorkoutId).toBeNull()
    expect(state.draftExercises).toEqual([])
  })

  it('sets draftWorkoutId when editing existing workout', () => {
    const existing = {
      id: 'abc',
      date: '2026-03-08',
      exercises: [{ exerciseId: 'bench', exerciseName: 'ベンチプレス', sets: [] }],
      memo: 'good',
    }
    act(() => useWorkoutStore.getState().startSession('2026-03-08', existing))
    const state = useWorkoutStore.getState()
    expect(state.draftWorkoutId).toBe('abc')
    expect(state.draftMemo).toBe('good')
  })
})

describe('addExercise', () => {
  it('adds exercise to draftExercises with empty pendingSet', () => {
    act(() => useWorkoutStore.getState().addExercise({
      exerciseId: 'bench',
      exerciseName: 'ベンチプレス',
    }))
    const { draftExercises } = useWorkoutStore.getState()
    expect(draftExercises).toHaveLength(1)
    expect(draftExercises[0].exerciseName).toBe('ベンチプレス')
    expect(draftExercises[0].sets).toEqual([])
    expect(draftExercises[0].pendingSet).toEqual({ weight: 0, reps: 0, memo: '' })
  })
})

describe('addSet', () => {
  it('moves pendingSet to sets and copies weight/reps to next pendingSet (memo empty)', () => {
    act(() => useWorkoutStore.getState().addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' }))
    act(() => {
      const state = useWorkoutStore.getState()
      state.updateSet(0, -1, { weight: 60, reps: 10, memo: 'first' })
    })
    // Use addSet which confirms pendingSet
    act(() => {
      useWorkoutStore.getState().addSet(0, { weight: 60, reps: 10, memo: 'first' })
    })
    const { draftExercises } = useWorkoutStore.getState()
    expect(draftExercises[0].sets).toHaveLength(1)
    expect(draftExercises[0].sets[0]).toEqual({ weight: 60, reps: 10, memo: 'first' })
    // Next pendingSet copies weight/reps, clears memo
    expect(draftExercises[0].pendingSet).toEqual({ weight: 60, reps: 10, memo: '' })
  })
})

describe('updateSet', () => {
  it('updates a confirmed set without touching pendingSet', () => {
    act(() => useWorkoutStore.getState().addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' }))
    act(() => useWorkoutStore.getState().addSet(0, { weight: 60, reps: 10, memo: '' }))
    act(() => useWorkoutStore.getState().updateSet(0, 0, { weight: 70, reps: 8, memo: 'edited' }))
    const { draftExercises } = useWorkoutStore.getState()
    expect(draftExercises[0].sets[0]).toEqual({ weight: 70, reps: 8, memo: 'edited' })
    // pendingSet unchanged
    expect(draftExercises[0].pendingSet.weight).toBe(60)
  })
})

describe('saveSession', () => {
  it('calls create when draftWorkoutId is null', () => {
    act(() => useWorkoutStore.getState().startSession('2026-03-08'))
    act(() => useWorkoutStore.getState().addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' }))
    act(() => useWorkoutStore.getState().addSet(0, { weight: 60, reps: 10, memo: '' }))
    act(() => useWorkoutStore.getState().saveSession())
    const state = useWorkoutStore.getState()
    expect(state.workouts).toHaveLength(1)
    expect(state.draftWorkoutId).toBeNull()
  })

  it('calls update when draftWorkoutId is a string', () => {
    const { create } = require('../lib/workoutRepository')
    const w = create({ date: '2026-03-08', exercises: [] })
    act(() => useWorkoutStore.getState().startSession(w.date, w))
    act(() => useWorkoutStore.getState().setDraftMemo('updated memo'))
    act(() => useWorkoutStore.getState().saveSession())
    const { getById } = require('../lib/workoutRepository')
    const saved = getById(w.id)
    expect(saved.memo).toBe('updated memo')
  })
})
