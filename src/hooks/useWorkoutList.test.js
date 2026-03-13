import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useWorkoutList from './useWorkoutList'
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

describe('useWorkoutList', () => {
  it('loads workouts on mount', () => {
    create({ date: '2026-03-08', exercises: [] })
    const { result } = renderHook(() => useWorkoutList())
    expect(result.current.workouts).toHaveLength(1)
  })

  it('deleteWorkout removes the workout', () => {
    const w = create({ date: '2026-03-08', exercises: [] })
    const { result } = renderHook(() => useWorkoutList())
    act(() => result.current.deleteWorkout(w.id))
    expect(result.current.workouts).toHaveLength(0)
  })
})
