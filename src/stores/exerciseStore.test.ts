import { describe, it, expect, beforeEach } from 'vitest'
import { useExerciseStore } from './exerciseStore'
import * as ExerciseRepository from '@/lib/exerciseRepository'

function resetStore() {
  useExerciseStore.setState({ exercises: ExerciseRepository.getAll() })
}

describe('exerciseStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
  })

  describe('初期状態', () => {
    it('空のストレージで exercises が空配列', () => {
      const { exercises } = useExerciseStore.getState()
      expect(exercises).toEqual([])
    })
  })

  describe('load()', () => {
    it('localStorage から exercises を再読込する', () => {
      useExerciseStore.getState().create('スクワット')
      localStorage.setItem(
        'gymini:exercises',
        JSON.stringify([{ id: 'x1', name: 'デッドリフト' }]),
      )
      useExerciseStore.getState().load()
      const { exercises } = useExerciseStore.getState()
      expect(exercises).toHaveLength(1)
      expect(exercises[0].name).toBe('デッドリフト')
    })
  })

  describe('create(name)', () => {
    it('新しい exercise を追加して返す', () => {
      const exercise = useExerciseStore.getState().create('ベンチプレス')
      expect(exercise.name).toBe('ベンチプレス')
      expect(exercise.id).toBeTruthy()
    })

    it('ストアの exercises に追加される', () => {
      useExerciseStore.getState().create('スクワット')
      const { exercises } = useExerciseStore.getState()
      expect(exercises).toHaveLength(1)
      expect(exercises[0].name).toBe('スクワット')
    })

    it('複数の exercise を追加できる', () => {
      useExerciseStore.getState().create('ベンチプレス')
      useExerciseStore.getState().create('スクワット')
      const { exercises } = useExerciseStore.getState()
      expect(exercises).toHaveLength(2)
    })

    it('空名で例外を投げる', () => {
      expect(() => useExerciseStore.getState().create('')).toThrow()
    })

    it('重複名で例外を投げる', () => {
      useExerciseStore.getState().create('ベンチプレス')
      expect(() => useExerciseStore.getState().create('ベンチプレス')).toThrow()
    })
  })

  describe('update(id, name)', () => {
    it('exercise 名を更新して返す', () => {
      const created = useExerciseStore.getState().create('ベンチプレス')
      const updated = useExerciseStore.getState().update(created.id, 'インクラインベンチ')
      expect(updated.name).toBe('インクラインベンチ')
      expect(updated.id).toBe(created.id)
    })

    it('更新後のストアに反映される', () => {
      const created = useExerciseStore.getState().create('ベンチプレス')
      useExerciseStore.getState().update(created.id, 'インクラインベンチ')
      const { exercises } = useExerciseStore.getState()
      expect(exercises[0].name).toBe('インクラインベンチ')
    })

    it('重複名で例外を投げる', () => {
      const e1 = useExerciseStore.getState().create('ベンチプレス')
      useExerciseStore.getState().create('スクワット')
      expect(() => useExerciseStore.getState().update(e1.id, 'スクワット')).toThrow()
    })
  })

  describe('remove(id)', () => {
    it('exercise をストアから削除する', () => {
      const exercise = useExerciseStore.getState().create('ベンチプレス')
      useExerciseStore.getState().remove(exercise.id)
      const { exercises } = useExerciseStore.getState()
      expect(exercises).toHaveLength(0)
    })

    it('存在しない id では例外を投げない', () => {
      expect(() => useExerciseStore.getState().remove('nonexistent-id')).not.toThrow()
    })

    it('対象のみ削除して他は残る', () => {
      const e1 = useExerciseStore.getState().create('ベンチプレス')
      useExerciseStore.getState().create('スクワット')
      useExerciseStore.getState().remove(e1.id)
      const { exercises } = useExerciseStore.getState()
      expect(exercises).toHaveLength(1)
      expect(exercises[0].name).toBe('スクワット')
    })
  })
})
