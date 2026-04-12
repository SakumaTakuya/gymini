import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useExercises } from './useExercises'
import { useExerciseStore } from '@/stores/exerciseStore'
import * as ExerciseRepository from '@/lib/exerciseRepository'

function resetStore() {
  useExerciseStore.setState({ exercises: [] })
}

describe('useExercises', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('exercises', () => {
    it('returns empty array when no exercises stored', () => {
      const { result } = renderHook(() => useExercises())
      expect(result.current.exercises).toEqual([])
    })

    it('loads exercises from repository on mount', () => {
      ExerciseRepository.create('ベンチプレス')
      ExerciseRepository.create('スクワット')

      const { result } = renderHook(() => useExercises())

      expect(result.current.exercises).toHaveLength(2)
      expect(result.current.exercises.map((e) => e.name)).toEqual([
        'ベンチプレス',
        'スクワット',
      ])
    })
  })

  describe('create', () => {
    it('adds exercise and updates subscribers', () => {
      const { result } = renderHook(() => useExercises())

      act(() => {
        result.current.create('デッドリフト')
      })

      expect(result.current.exercises.map((e) => e.name)).toContain('デッドリフト')
      // Repository にも永続化されている
      expect(ExerciseRepository.getAll().map((e) => e.name)).toContain('デッドリフト')
    })

    it('propagates duplicate name errors from repository', () => {
      ExerciseRepository.create('ベンチプレス')
      const { result } = renderHook(() => useExercises())

      expect(() =>
        act(() => {
          result.current.create('ベンチプレス')
        }),
      ).toThrow(/Duplicate name/)
    })
  })

  describe('update', () => {
    it('renames exercise and updates subscribers', () => {
      const ex = ExerciseRepository.create('ベンチプレス')
      const { result } = renderHook(() => useExercises())

      act(() => {
        result.current.update(ex.id, 'インクラインベンチ')
      })

      expect(result.current.exercises.map((e) => e.name)).toContain('インクラインベンチ')
      expect(result.current.exercises.map((e) => e.name)).not.toContain('ベンチプレス')
    })
  })

  describe('remove', () => {
    it('deletes exercise and updates subscribers', () => {
      const ex = ExerciseRepository.create('ベンチプレス')
      ExerciseRepository.create('スクワット')
      const { result } = renderHook(() => useExercises())

      act(() => {
        result.current.remove(ex.id)
      })

      expect(result.current.exercises.map((e) => e.name)).toEqual(['スクワット'])
    })
  })

  describe('search', () => {
    it('returns all exercises when query is empty', () => {
      ExerciseRepository.create('ベンチプレス')
      ExerciseRepository.create('スクワット')
      const { result } = renderHook(() => useExercises())

      expect(result.current.search('')).toHaveLength(2)
    })

    it('filters by partial match (case insensitive)', () => {
      ExerciseRepository.create('ベンチプレス')
      ExerciseRepository.create('インクラインベンチ')
      ExerciseRepository.create('スクワット')
      const { result } = renderHook(() => useExercises())

      const found = result.current.search('ベンチ')
      expect(found.map((e) => e.name).sort()).toEqual([
        'インクラインベンチ',
        'ベンチプレス',
      ])
    })
  })

  describe('cross-subscriber synchronization', () => {
    it('updates all subscribers when one calls create', () => {
      const { result: a } = renderHook(() => useExercises())
      const { result: b } = renderHook(() => useExercises())

      act(() => {
        a.current.create('デッドリフト')
      })

      expect(a.current.exercises.map((e) => e.name)).toContain('デッドリフト')
      expect(b.current.exercises.map((e) => e.name)).toContain('デッドリフト')
    })

    it('updates all subscribers when one calls remove', () => {
      const ex = ExerciseRepository.create('ベンチプレス')
      const { result: a } = renderHook(() => useExercises())
      const { result: b } = renderHook(() => useExercises())

      act(() => {
        a.current.remove(ex.id)
      })

      expect(a.current.exercises).toHaveLength(0)
      expect(b.current.exercises).toHaveLength(0)
    })
  })

  describe('cross-tab synchronization', () => {
    it('reloads from repository when storage event fires for exercises key', () => {
      const { result } = renderHook(() => useExercises())
      expect(result.current.exercises).toHaveLength(0)

      // 他タブが localStorage を書き換えた状況をシミュレート
      ExerciseRepository.create('デッドリフト')
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', { key: 'gymini:exercises' }),
        )
      })

      expect(result.current.exercises.map((e) => e.name)).toContain('デッドリフト')
    })

    it('ignores storage events for other keys', () => {
      const { result } = renderHook(() => useExercises())

      ExerciseRepository.create('デッドリフト')
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', { key: 'gymini:other-key' }),
        )
      })

      // 他キーなのでロードされない
      expect(result.current.exercises).toHaveLength(0)
    })
  })
})
