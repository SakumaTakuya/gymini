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
    it('種目が保存されていない場合は空配列を返す', () => {
      const { result } = renderHook(() => useExercises())
      expect(result.current.exercises).toEqual([])
    })

    it('マウント時にリポジトリから種目を読み込む', () => {
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
    it('種目を追加してサブスクライバーを更新する', () => {
      const { result } = renderHook(() => useExercises())

      act(() => {
        result.current.create('デッドリフト')
      })

      expect(result.current.exercises.map((e) => e.name)).toContain('デッドリフト')
      // Repository にも永続化されている
      expect(ExerciseRepository.getAll().map((e) => e.name)).toContain('デッドリフト')
    })

    it('リポジトリからの重複名エラーを伝播する', () => {
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
    it('種目の名前を変更してサブスクライバーを更新する', () => {
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
    it('種目を削除してサブスクライバーを更新する', () => {
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
    it('クエリが空のとき全種目を返す', () => {
      ExerciseRepository.create('ベンチプレス')
      ExerciseRepository.create('スクワット')
      const { result } = renderHook(() => useExercises())

      expect(result.current.search('')).toHaveLength(2)
    })

    it('部分一致（大文字小文字を区別しない）でフィルタリングする', () => {
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

  describe('サブスクライバー間の同期', () => {
    it('1つが create を呼んだとき全サブスクライバーを更新する', () => {
      const { result: a } = renderHook(() => useExercises())
      const { result: b } = renderHook(() => useExercises())

      act(() => {
        a.current.create('デッドリフト')
      })

      expect(a.current.exercises.map((e) => e.name)).toContain('デッドリフト')
      expect(b.current.exercises.map((e) => e.name)).toContain('デッドリフト')
    })

    it('1つが remove を呼んだとき全サブスクライバーを更新する', () => {
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

  describe('タブ間の同期', () => {
    it('exercises キーの storage イベントが発火したときリポジトリから再読込する', () => {
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

    it('他のキーの storage イベントは無視する', () => {
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
