import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as repo from './exerciseRepository'

describe('ExerciseRepository', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // --- load / save helpers (tested via getAll) ---

  describe('getAll', () => {
    it('localStorage が空のとき空配列を返す', () => {
      expect(repo.getAll()).toEqual([])
    })

    it('データが存在するとき全種目を返す', () => {
      localStorage.setItem(
        'gymini:exercises',
        JSON.stringify([
          { id: '1', name: 'ベンチプレス' },
          { id: '2', name: 'スクワット' },
        ]),
      )
      const result = repo.getAll()
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('ベンチプレス')
      expect(result[1].name).toBe('スクワット')
    })

    it('localStorage に不正な JSON がある場合は空配列を返す', () => {
      localStorage.setItem('gymini:exercises', 'invalid json')
      expect(repo.getAll()).toEqual([])
    })

    it('スキーマに違反する形のデータは空配列を返す（破損データの拒否）', () => {
      localStorage.setItem(
        'gymini:exercises',
        JSON.stringify([{ id: 1, name: 2 }]),
      )
      expect(repo.getAll()).toEqual([])
    })

    it('必須フィールドが欠落したデータは空配列を返す', () => {
      localStorage.setItem(
        'gymini:exercises',
        JSON.stringify([{ id: '1' }, { name: 'スクワット' }]),
      )
      expect(repo.getAll()).toEqual([])
    })

    it('配列でないデータは空配列を返す', () => {
      localStorage.setItem(
        'gymini:exercises',
        JSON.stringify({ id: '1', name: 'ベンチプレス' }),
      )
      expect(repo.getAll()).toEqual([])
    })
  })

  // --- search ---

  describe('search', () => {
    beforeEach(() => {
      localStorage.setItem(
        'gymini:exercises',
        JSON.stringify([
          { id: '1', name: 'ベンチプレス' },
          { id: '2', name: 'インクラインベンチプレス' },
          { id: '3', name: 'スクワット' },
        ]),
      )
    })

    it('部分一致で一致する種目を返す', () => {
      const result = repo.search('ベンチ')
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('ベンチプレス')
      expect(result[1].name).toBe('インクラインベンチプレス')
    })

    it('大文字小文字を区別しない', () => {
      localStorage.setItem(
        'gymini:exercises',
        JSON.stringify([
          { id: '1', name: 'Bench Press' },
          { id: '2', name: 'bench press' },
        ]),
      )
      const result = repo.search('bench')
      expect(result).toHaveLength(2)
    })

    it('クエリが空文字のとき全種目を返す', () => {
      expect(repo.search('')).toHaveLength(3)
    })

    it('クエリが空白のみのとき全種目を返す', () => {
      expect(repo.search('   ')).toHaveLength(3)
    })

    it('一致する結果がない場合は空配列を返す', () => {
      expect(repo.search('デッドリフト')).toEqual([])
    })
  })

  // --- create ---

  describe('create', () => {
    it('生成した id で新しい種目を作成する', () => {
      const exercise = repo.create('ベンチプレス')
      expect(exercise.name).toBe('ベンチプレス')
      expect(exercise.id).toBeTruthy()
    })

    it('種目を localStorage に永続化する', () => {
      repo.create('ベンチプレス')
      const all = repo.getAll()
      expect(all).toHaveLength(1)
      expect(all[0].name).toBe('ベンチプレス')
    })

    it('名前の前後の空白を除去する', () => {
      const exercise = repo.create('  ベンチプレス  ')
      expect(exercise.name).toBe('ベンチプレス')
    })

    it('名前が空のとき例外を投げる', () => {
      expect(() => repo.create('')).toThrow('Exercise name is empty')
    })

    it('名前が空白のみのとき例外を投げる', () => {
      expect(() => repo.create('   ')).toThrow('Exercise name is empty')
    })

    it('名前が重複しているとき例外を投げる（大文字小文字を区別）', () => {
      repo.create('ベンチプレス')
      expect(() => repo.create('ベンチプレス')).toThrow('Duplicate name: ベンチプレス')
    })

    it('大文字小文字が異なる場合は別の種目として登録できる', () => {
      repo.create('Bench Press')
      expect(() => repo.create('bench press')).not.toThrow()
      expect(repo.getAll()).toHaveLength(2)
    })
  })

  // --- update ---

  describe('update', () => {
    it('種目名を更新する', () => {
      const exercise = repo.create('ベンチプレス')
      const updated = repo.update(exercise.id, 'インクラインベンチプレス')
      expect(updated.id).toBe(exercise.id)
      expect(updated.name).toBe('インクラインベンチプレス')
    })

    it('更新を localStorage に永続化する', () => {
      const exercise = repo.create('ベンチプレス')
      repo.update(exercise.id, 'インクラインベンチプレス')
      const all = repo.getAll()
      expect(all[0].name).toBe('インクラインベンチプレス')
    })

    it('名前の前後の空白を除去する', () => {
      const exercise = repo.create('ベンチプレス')
      const updated = repo.update(exercise.id, '  スクワット  ')
      expect(updated.name).toBe('スクワット')
    })

    it('名前が空のとき例外を投げる', () => {
      const exercise = repo.create('ベンチプレス')
      expect(() => repo.update(exercise.id, '')).toThrow('Exercise name is empty')
    })

    it('名前が空白のみのとき例外を投げる', () => {
      const exercise = repo.create('ベンチプレス')
      expect(() => repo.update(exercise.id, '   ')).toThrow('Exercise name is empty')
    })

    it('id が存在しないとき例外を投げる', () => {
      expect(() => repo.update('nonexistent', 'スクワット')).toThrow(
        'Exercise not found: nonexistent',
      )
    })

    it('名前が別の種目と重複するとき例外を投げる', () => {
      const exercise = repo.create('ベンチプレス')
      repo.create('スクワット')
      expect(() => repo.update(exercise.id, 'スクワット')).toThrow(
        'Duplicate name: スクワット',
      )
    })

    it('同じ名前への更新を許可する（自己衝突なし）', () => {
      const exercise = repo.create('ベンチプレス')
      expect(() => repo.update(exercise.id, 'ベンチプレス')).not.toThrow()
    })
  })

  // --- remove ---

  describe('remove', () => {
    it('id で種目を削除する', () => {
      const exercise = repo.create('ベンチプレス')
      repo.remove(exercise.id)
      expect(repo.getAll()).toEqual([])
    })

    it('id が存在しなくても例外を投げない（冪等）', () => {
      expect(() => repo.remove('nonexistent')).not.toThrow()
    })

    it('対象の種目のみ削除する', () => {
      repo.create('ベンチプレス')
      const squat = repo.create('スクワット')
      repo.remove(squat.id)
      const all = repo.getAll()
      expect(all).toHaveLength(1)
      expect(all[0].name).toBe('ベンチプレス')
    })
  })

  describe('localStorage エラーハンドリング', () => {
    it('localStorage.getItem がスローしたとき空配列を返す', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('QuotaExceeded')
      })
      expect(repo.getAll()).toEqual([])
      vi.restoreAllMocks()
    })

    it('create 時に localStorage.setItem が失敗しても例外を投げない', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded')
      })
      // create still returns the exercise (in-memory), but save silently fails
      const exercise = repo.create('ベンチプレス')
      expect(exercise.name).toBe('ベンチプレス')
      vi.restoreAllMocks()
    })
  })

  // --- category（部位） ---

  describe('category', () => {
    it('category を持たない旧データは unassigned に移行される', () => {
      localStorage.setItem(
        'gymini:exercises',
        JSON.stringify([{ id: '1', name: 'ベンチプレス' }]),
      )
      expect(repo.getAll()[0].category).toBe('unassigned')
    })

    it('create の既定 category は unassigned', () => {
      const ex = repo.create('ベンチプレス')
      expect(ex.category).toBe('unassigned')
    })

    it('create で category を指定できる', () => {
      const ex = repo.create('ベンチプレス', 'chest')
      expect(ex.category).toBe('chest')
      expect(repo.getAll()[0].category).toBe('chest')
    })

    it('update で category を変更できる', () => {
      const ex = repo.create('ベンチプレス', 'chest')
      const updated = repo.update(ex.id, 'ベンチプレス', 'back')
      expect(updated.category).toBe('back')
      expect(repo.getAll()[0].category).toBe('back')
    })

    it('update で category 未指定なら既存の category を保持する', () => {
      const ex = repo.create('ベンチプレス', 'chest')
      const updated = repo.update(ex.id, 'インクラインベンチプレス')
      expect(updated.name).toBe('インクラインベンチプレス')
      expect(updated.category).toBe('chest')
    })
  })
})
