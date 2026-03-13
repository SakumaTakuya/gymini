import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useWorkoutSession from './useWorkoutSession'
import { create } from '../lib/workoutRepository'
import useWorkoutStore from '../stores/workoutStore'

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

describe('useWorkoutSession', () => {
  it('startSession sets draftDate to today when no date given', () => {
    const today = new Date().toISOString().slice(0, 10)
    const { result } = renderHook(() => useWorkoutSession())
    act(() => result.current.startSession())
    expect(result.current.draftDate).toBe(today)
  })

  it('startEditSession sets draftWorkoutId', () => {
    const w = create({ date: '2026-03-08', exercises: [] })
    const { result } = renderHook(() => useWorkoutSession())
    act(() => result.current.startEditSession(w))
    expect(useWorkoutStore.getState().draftWorkoutId).toBe(w.id)
  })

  it('addSet confirms pendingSet and copies weight/reps to next pendingSet (memo empty)', () => {
    const { result } = renderHook(() => useWorkoutSession())
    act(() => result.current.startSession('2026-03-08'))
    act(() => result.current.addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' }))
    act(() => result.current.addSet(0, { weight: 60, reps: 10, memo: 'test' }))
    const ex = result.current.draftExercises[0]
    expect(ex.sets).toHaveLength(1)
    expect(ex.sets[0].memo).toBe('test')
    expect(ex.pendingSet).toEqual({ weight: 60, reps: 10, memo: '' })
  })

  it('updateSet updates confirmed set', () => {
    const { result } = renderHook(() => useWorkoutSession())
    act(() => result.current.startSession('2026-03-08'))
    act(() => result.current.addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' }))
    act(() => result.current.addSet(0, { weight: 60, reps: 10, memo: '' }))
    act(() => result.current.updateSet(0, 0, { weight: 70, reps: 8, memo: 'edited' }))
    expect(result.current.draftExercises[0].sets[0].weight).toBe(70)
  })

  it('saveSession creates new workout when draftWorkoutId is null', () => {
    const { result } = renderHook(() => useWorkoutSession())
    act(() => result.current.startSession('2026-03-08'))
    act(() => result.current.addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' }))
    act(() => result.current.addSet(0, { weight: 60, reps: 10, memo: '' }))
    act(() => result.current.saveSession())
    expect(useWorkoutStore.getState().workouts).toHaveLength(1)
  })

  it('cancelSession resets draft state', () => {
    const { result } = renderHook(() => useWorkoutSession())
    act(() => result.current.startSession('2026-03-08'))
    act(() => result.current.cancelSession())
    expect(result.current.draftDate).toBe('')
    expect(result.current.draftExercises).toEqual([])
  })

  it('searchExercises returns matching exercises', () => {
    const exercises = [{ id: 'bench', name: 'ベンチプレス' }]
    localStorage.setItem('gymini:exercises', JSON.stringify(exercises))
    const { result } = renderHook(() => useWorkoutSession())
    const found = result.current.searchExercises('ベンチ')
    expect(found).toHaveLength(1)
  })
})
