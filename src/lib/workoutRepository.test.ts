import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as repo from './workoutRepository'
import { toDateString } from '../schemas/date'
import type { WorkoutInput } from '../schemas/workout'
import type { ISODateTimeString, DateString } from '../schemas/date'

const makeInput = (
  overrides: Partial<WorkoutInput> = {},
): WorkoutInput => ({
  date: '2026-03-08' as DateString,
  exercises: [
    {
      exerciseId: 'bench-press',
      exerciseName: 'ベンチプレス',
      sets: [{ weight: 60, reps: 10 }],
    },
  ],
  startedAt: '2026-03-08T10:00:00.000Z' as ISODateTimeString,
  endedAt: '2026-03-08T10:45:00.000Z' as ISODateTimeString,
  ...overrides,
})

describe('WorkoutRepository', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('save', () => {
    it('saves a workout and returns it with id/createdAt/updatedAt', () => {
      const input = makeInput()
      const result = repo.save(input)
      expect(result.id).toBeTruthy()
      expect(result.date).toBe('2026-03-08')
      expect(result.exercises).toEqual(input.exercises)
      expect(result.createdAt).toBeTruthy()
      expect(result.updatedAt).toBeTruthy()
    })

    it('persists to localStorage', () => {
      repo.save(makeInput())
      const raw = localStorage.getItem('gymini:workouts')
      expect(raw).toBeTruthy()
      const data = JSON.parse(raw!)
      expect(data).toHaveLength(1)
    })

    it('appends to existing workouts', () => {
      repo.save(makeInput())
      repo.save(makeInput({ date: '2026-03-09' as DateString }))
      const all = repo.listByDateDesc()
      expect(all).toHaveLength(2)
    })
  })

  describe('getById', () => {
    it('returns the workout by id', () => {
      const saved = repo.save(makeInput())
      const found = repo.getById(saved.id)
      expect(found).toEqual(saved)
    })

    it('returns undefined for non-existent id', () => {
      expect(repo.getById('nonexistent')).toBeUndefined()
    })
  })

  describe('remove', () => {
    it('removes the workout by id', () => {
      const saved = repo.save(makeInput())
      repo.remove(saved.id)
      expect(repo.getById(saved.id)).toBeUndefined()
    })

    it('does not throw for non-existent id (idempotent)', () => {
      expect(() => repo.remove('nonexistent')).not.toThrow()
    })

    it('only removes the target workout', () => {
      const w1 = repo.save(makeInput())
      const w2 = repo.save(makeInput({ date: '2026-03-09' as DateString }))
      repo.remove(w1.id)
      expect(repo.getById(w2.id)).toBeTruthy()
      expect(repo.listByDateDesc()).toHaveLength(1)
    })
  })

  describe('listByDateDesc', () => {
    it('returns empty array when no workouts', () => {
      expect(repo.listByDateDesc()).toEqual([])
    })

    it('returns workouts sorted by date descending', () => {
      repo.save(makeInput({ date: '2026-03-07' as DateString }))
      repo.save(makeInput({ date: '2026-03-09' as DateString }))
      repo.save(makeInput({ date: '2026-03-08' as DateString }))
      const result = repo.listByDateDesc()
      expect(result[0].date).toBe('2026-03-09')
      expect(result[1].date).toBe('2026-03-08')
      expect(result[2].date).toBe('2026-03-07')
    })
  })

  describe('listByDate', () => {
    it('returns workouts for the specified date', () => {
      repo.save(makeInput({ date: '2026-03-08' as DateString }))
      repo.save(makeInput({ date: '2026-03-09' as DateString }))
      repo.save(makeInput({ date: '2026-03-08' as DateString }))
      const result = repo.listByDate(toDateString('2026-03-08'))
      expect(result).toHaveLength(2)
      expect(result.every((w) => w.date === '2026-03-08')).toBe(true)
    })

    it('returns empty array when no workouts for the date', () => {
      repo.save(makeInput({ date: '2026-03-08' as DateString }))
      expect(repo.listByDate(toDateString('2026-03-09'))).toEqual([])
    })
  })

  describe('localStorage error handling', () => {
    it('returns empty array when localStorage has invalid JSON', () => {
      localStorage.setItem('gymini:workouts', 'invalid json')
      expect(repo.listByDateDesc()).toEqual([])
    })

    it('returns empty array when localStorage has invalid data structure', () => {
      localStorage.setItem(
        'gymini:workouts',
        JSON.stringify([{ invalid: true }]),
      )
      expect(repo.listByDateDesc()).toEqual([])
    })

    it('returns empty array when localStorage.getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('QuotaExceeded')
      })
      expect(repo.listByDateDesc()).toEqual([])
      vi.restoreAllMocks()
    })
  })
})
