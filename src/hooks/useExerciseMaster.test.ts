import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useExerciseMaster from './useExerciseMaster'

const STORAGE_KEY = 'gymini:exercises'

beforeEach(() => {
  localStorage.clear()
  const exercises = [
    { id: 'bench-press', name: 'ベンチプレス' },
    { id: 'squat', name: 'スクワット' },
  ]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises))
})

describe('useExerciseMaster', () => {
  it('loads all exercises on mount', () => {
    const { result } = renderHook(() => useExerciseMaster())
    expect(result.current.exercises).toHaveLength(2)
  })

  it('adds an exercise and refreshes list', () => {
    const { result } = renderHook(() => useExerciseMaster())
    act(() => {
      result.current.addExercise('デッドリフト')
    })
    expect(result.current.exercises).toHaveLength(3)
    expect(result.current.exercises[2].name).toBe('デッドリフト')
    expect(result.current.error).toBeNull()
  })

  it('sets error on duplicate name', () => {
    const { result } = renderHook(() => useExerciseMaster())
    act(() => {
      result.current.addExercise('ベンチプレス')
    })
    expect(result.current.exercises).toHaveLength(2)
    expect(result.current.error).toBeTruthy()
  })

  it('removes an exercise and refreshes list', () => {
    const { result } = renderHook(() => useExerciseMaster())
    act(() => {
      result.current.removeExercise('bench-press')
    })
    expect(result.current.exercises).toHaveLength(1)
    expect(result.current.exercises[0].name).toBe('スクワット')
  })

  it('clears error after successful add', () => {
    const { result } = renderHook(() => useExerciseMaster())
    act(() => {
      result.current.addExercise('ベンチプレス') // duplicate -> error
    })
    expect(result.current.error).toBeTruthy()
    act(() => {
      result.current.addExercise('デッドリフト') // valid -> clears error
    })
    expect(result.current.error).toBeNull()
  })
})
