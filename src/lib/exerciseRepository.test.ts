import { describe, it, expect, beforeEach } from 'vitest'
import { getAll, search, create, remove } from './exerciseRepository'

const STORAGE_KEY = 'gymini:exercises'

beforeEach(() => {
  localStorage.clear()
  const exercises = [
    { id: 'bench-press', name: 'ベンチプレス' },
    { id: 'squat', name: 'スクワット' },
    { id: 'deadlift', name: 'デッドリフト' },
  ]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises))
})

describe('getAll', () => {
  it('returns all exercises', () => {
    const results = getAll()
    expect(results).toHaveLength(3)
    expect(results[0].name).toBe('ベンチプレス')
  })

  it('returns [] when localStorage is empty', () => {
    localStorage.clear()
    expect(getAll()).toEqual([])
  })

  it('returns [] when localStorage has invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json')
    expect(getAll()).toEqual([])
  })
})

describe('create', () => {
  it('creates a new exercise and returns it', () => {
    const exercise = create('カーフレイズ')
    expect(exercise.name).toBe('カーフレイズ')
    expect(exercise.id).toBeTruthy()
    expect(getAll()).toHaveLength(4)
  })

  it('throws Error when name already exists', () => {
    expect(() => create('ベンチプレス')).toThrow()
  })

  it('persists to localStorage', () => {
    create('カーフレイズ')
    const raw = localStorage.getItem(STORAGE_KEY)
    const exercises = JSON.parse(raw!)
    expect(exercises).toHaveLength(4)
    expect(exercises[3].name).toBe('カーフレイズ')
  })
})

describe('remove', () => {
  it('removes an exercise by id', () => {
    remove('bench-press')
    expect(getAll()).toHaveLength(2)
    expect(getAll().find((e) => e.id === 'bench-press')).toBeUndefined()
  })

  it('does nothing when id does not exist', () => {
    remove('nonexistent')
    expect(getAll()).toHaveLength(3)
  })
})

describe('search', () => {
  it('returns exercises matching the query (partial match)', () => {
    const results = search('ベンチ')
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('ベンチプレス')
  })

  it('returns all exercises when query is empty string', () => {
    const results = search('')
    expect(results).toHaveLength(3)
  })

  it('returns [] when no match', () => {
    const results = search('カーフレイズ')
    expect(results).toEqual([])
  })

  it('returns [] when localStorage is empty', () => {
    localStorage.clear()
    expect(search('ベンチ')).toEqual([])
  })
})
