import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as repo from './exerciseRepository'

describe('ExerciseRepository', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // --- load / save helpers (tested via getAll) ---

  describe('getAll', () => {
    it('returns empty array when localStorage is empty', () => {
      expect(repo.getAll()).toEqual([])
    })

    it('returns all exercises when data exists', () => {
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

    it('returns empty array when localStorage has invalid JSON', () => {
      localStorage.setItem('gymini:exercises', 'invalid json')
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

    it('returns matching exercises by partial match', () => {
      const result = repo.search('ベンチ')
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('ベンチプレス')
      expect(result[1].name).toBe('インクラインベンチプレス')
    })

    it('is case-insensitive', () => {
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

    it('returns all exercises when query is empty string', () => {
      expect(repo.search('')).toHaveLength(3)
    })

    it('returns all exercises when query is whitespace only', () => {
      expect(repo.search('   ')).toHaveLength(3)
    })

    it('returns empty array when no match found', () => {
      expect(repo.search('デッドリフト')).toEqual([])
    })
  })

  // --- create ---

  describe('create', () => {
    it('creates a new exercise with generated id', () => {
      const exercise = repo.create('ベンチプレス')
      expect(exercise.name).toBe('ベンチプレス')
      expect(exercise.id).toBeTruthy()
    })

    it('persists the exercise to localStorage', () => {
      repo.create('ベンチプレス')
      const all = repo.getAll()
      expect(all).toHaveLength(1)
      expect(all[0].name).toBe('ベンチプレス')
    })

    it('trims whitespace from name', () => {
      const exercise = repo.create('  ベンチプレス  ')
      expect(exercise.name).toBe('ベンチプレス')
    })

    it('throws when name is empty', () => {
      expect(() => repo.create('')).toThrow('Exercise name is empty')
    })

    it('throws when name is whitespace only', () => {
      expect(() => repo.create('   ')).toThrow('Exercise name is empty')
    })

    it('throws when name is duplicate (case-sensitive)', () => {
      repo.create('ベンチプレス')
      expect(() => repo.create('ベンチプレス')).toThrow('Duplicate name: ベンチプレス')
    })

    it('allows different case as separate exercise', () => {
      repo.create('Bench Press')
      expect(() => repo.create('bench press')).not.toThrow()
      expect(repo.getAll()).toHaveLength(2)
    })
  })

  // --- update ---

  describe('update', () => {
    it('updates the exercise name', () => {
      const exercise = repo.create('ベンチプレス')
      const updated = repo.update(exercise.id, 'インクラインベンチプレス')
      expect(updated.id).toBe(exercise.id)
      expect(updated.name).toBe('インクラインベンチプレス')
    })

    it('persists the update to localStorage', () => {
      const exercise = repo.create('ベンチプレス')
      repo.update(exercise.id, 'インクラインベンチプレス')
      const all = repo.getAll()
      expect(all[0].name).toBe('インクラインベンチプレス')
    })

    it('trims whitespace from name', () => {
      const exercise = repo.create('ベンチプレス')
      const updated = repo.update(exercise.id, '  スクワット  ')
      expect(updated.name).toBe('スクワット')
    })

    it('throws when name is empty', () => {
      const exercise = repo.create('ベンチプレス')
      expect(() => repo.update(exercise.id, '')).toThrow('Exercise name is empty')
    })

    it('throws when name is whitespace only', () => {
      const exercise = repo.create('ベンチプレス')
      expect(() => repo.update(exercise.id, '   ')).toThrow('Exercise name is empty')
    })

    it('throws when id does not exist', () => {
      expect(() => repo.update('nonexistent', 'スクワット')).toThrow(
        'Exercise not found: nonexistent',
      )
    })

    it('throws when name duplicates another exercise', () => {
      const exercise = repo.create('ベンチプレス')
      repo.create('スクワット')
      expect(() => repo.update(exercise.id, 'スクワット')).toThrow(
        'Duplicate name: スクワット',
      )
    })

    it('allows updating to the same name (no self-conflict)', () => {
      const exercise = repo.create('ベンチプレス')
      expect(() => repo.update(exercise.id, 'ベンチプレス')).not.toThrow()
    })
  })

  // --- remove ---

  describe('remove', () => {
    it('removes the exercise by id', () => {
      const exercise = repo.create('ベンチプレス')
      repo.remove(exercise.id)
      expect(repo.getAll()).toEqual([])
    })

    it('does not throw when id does not exist (idempotent)', () => {
      expect(() => repo.remove('nonexistent')).not.toThrow()
    })

    it('only removes the target exercise', () => {
      repo.create('ベンチプレス')
      const squat = repo.create('スクワット')
      repo.remove(squat.id)
      const all = repo.getAll()
      expect(all).toHaveLength(1)
      expect(all[0].name).toBe('ベンチプレス')
    })
  })

  describe('localStorage error handling', () => {
    it('returns empty array when localStorage.getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('QuotaExceeded')
      })
      expect(repo.getAll()).toEqual([])
      vi.restoreAllMocks()
    })

    it('does not throw when localStorage.setItem fails on create', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded')
      })
      // create still returns the exercise (in-memory), but save silently fails
      const exercise = repo.create('ベンチプレス')
      expect(exercise.name).toBe('ベンチプレス')
      vi.restoreAllMocks()
    })
  })
})
