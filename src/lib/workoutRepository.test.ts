import { describe, it, expect, beforeEach, vi } from 'vitest'
import { create, getById, listByDateDesc, listByDate, update, remove } from './workoutRepository'

const STORAGE_KEY = 'gymini:workouts'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('create', () => {
  it('saves a workout and returns it with id, createdAt, updatedAt', () => {
    const input = { date: '2026-03-08', exercises: [], memo: '' }
    const result = create(input)
    expect(result.id).toBeDefined()
    expect(result.createdAt).toBeDefined()
    expect(result.updatedAt).toBeDefined()
    expect(result.date).toBe('2026-03-08')
  })

  it('persists to localStorage', () => {
    const input = { date: '2026-03-08', exercises: [] }
    create(input)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored).toHaveLength(1)
  })
})

describe('getById', () => {
  it('returns the workout for a valid id', () => {
    const w = create({ date: '2026-03-08', exercises: [] })
    expect(getById(w.id)).toEqual(w)
  })

  it('returns undefined for an unknown id', () => {
    expect(getById('nonexistent')).toBeUndefined()
  })
})

describe('listByDateDesc', () => {
  it('returns workouts sorted by date descending', () => {
    create({ date: '2026-03-01', exercises: [] })
    create({ date: '2026-03-10', exercises: [] })
    create({ date: '2026-03-05', exercises: [] })
    const list = listByDateDesc()
    expect(list[0].date).toBe('2026-03-10')
    expect(list[1].date).toBe('2026-03-05')
    expect(list[2].date).toBe('2026-03-01')
  })

  it('returns [] when no workouts', () => {
    expect(listByDateDesc()).toEqual([])
  })
})

describe('listByDate', () => {
  it('returns workouts for the specified date', () => {
    create({ date: '2026-03-08', exercises: [] })
    create({ date: '2026-03-09', exercises: [] })
    const list = listByDate('2026-03-08')
    expect(list).toHaveLength(1)
    expect(list[0].date).toBe('2026-03-08')
  })

  it('returns [] when no matching workouts', () => {
    expect(listByDate('2026-03-08')).toEqual([])
  })
})

describe('update', () => {
  it('updates the workout and refreshes updatedAt', async () => {
    const w = create({ date: '2026-03-08', exercises: [] })
    await new Promise((r) => setTimeout(r, 2))
    const updated = update(w.id, { date: '2026-03-09', exercises: [] })
    expect(updated?.date).toBe('2026-03-09')
    expect(updated?.createdAt).toBe(w.createdAt)
    expect(updated?.updatedAt).not.toBe(w.updatedAt)
  })

  it('returns null for unknown id', () => {
    expect(update('nonexistent', { date: '2026-03-08', exercises: [] })).toBeNull()
  })
})

describe('remove', () => {
  it('removes the target workout', () => {
    const w1 = create({ date: '2026-03-08', exercises: [] })
    const w2 = create({ date: '2026-03-09', exercises: [] })
    remove(w1.id)
    expect(getById(w1.id)).toBeUndefined()
    expect(getById(w2.id)).toBeDefined()
  })
})

describe('localStorage error handling', () => {
  it('returns [] when localStorage.getItem throws', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('storage error') })
    expect(listByDateDesc()).toEqual([])
  })
})
