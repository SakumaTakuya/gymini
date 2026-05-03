import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWorkoutSession } from './useWorkoutSession'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import { useExerciseStore } from '../stores/exerciseStore'

function resetStore() {
  useWorkoutSessionStore.setState({
    isActive: false,
    startedAt: null,
    date: null,
    draftExercises: [],
  })
  useExerciseStore.setState({ exercises: [] })
}

describe('useWorkoutSession', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ストアの状態を公開する', () => {
    const { result } = renderHook(() => useWorkoutSession())
    expect(result.current.isActive).toBe(false)
    expect(result.current.startedAt).toBeNull()
    expect(result.current.draftExercises).toEqual([])
  })

  it('ストアのアクションを公開する', () => {
    const { result } = renderHook(() => useWorkoutSession())
    expect(typeof result.current.startSession).toBe('function')
    expect(typeof result.current.endSession).toBe('function')
    expect(typeof result.current.addExercise).toBe('function')
    expect(typeof result.current.activateExercise).toBe('function')
    expect(typeof result.current.completeSet).toBe('function')
    expect(typeof result.current.editCompletedSet).toBe('function')
    expect(typeof result.current.deleteCompletedSet).toBe('function')
    expect(typeof result.current.toggleExerciseCard).toBe('function')
  })

  it('searchExercises を公開する', () => {
    const { result } = renderHook(() => useWorkoutSession())
    expect(typeof result.current.searchExercises).toBe('function')
  })

  describe('elapsedSeconds', () => {
    it('セッションが非アクティブのとき 0 である', () => {
      const { result } = renderHook(() => useWorkoutSession())
      expect(result.current.elapsedSeconds).toBe(0)
    })

    it('セッションがアクティブのとき毎秒更新される', () => {
      vi.setSystemTime(new Date('2026-03-08T10:00:00.000Z'))

      const { result } = renderHook(() => useWorkoutSession())

      act(() => {
        result.current.startSession()
      })

      // Advance 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.elapsedSeconds).toBe(5)
    })

    it('セッション終了後に更新を停止する', () => {
      vi.setSystemTime(new Date('2026-03-08T10:00:00.000Z'))

      const { result } = renderHook(() => useWorkoutSession())

      act(() => {
        result.current.startSession()
      })

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      act(() => {
        result.current.endSession()
      })

      // startedAt が null になった後、次の interval tick で 0 にリセットされる
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.elapsedSeconds).toBe(0)
    })
  })

  describe('searchExercises', () => {
    it('useExercises().search に委譲する', () => {
      // Add some exercises to localStorage
      localStorage.setItem(
        'gymini:exercises',
        JSON.stringify([
          { id: '1', name: 'ベンチプレス' },
          { id: '2', name: 'スクワット' },
        ]),
      )

      const { result } = renderHook(() => useWorkoutSession())
      const found = result.current.searchExercises('ベンチ')
      expect(found).toHaveLength(1)
      expect(found[0].name).toBe('ベンチプレス')
    })
  })

  describe('createExercise', () => {
    it('useExercises().create を通じて新しい種目を作成する', () => {
      const { result } = renderHook(() => useWorkoutSession())

      let created: { id: string; name: string } | undefined
      act(() => {
        created = result.current.createExercise('デッドリフト')
      })

      expect(created?.name).toBe('デッドリフト')
      // exerciseStore にも反映されている
      expect(
        useExerciseStore.getState().exercises.some((e) => e.name === 'デッドリフト'),
      ).toBe(true)
    })
  })
})
