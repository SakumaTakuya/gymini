import { describe, it, expect, beforeEach } from 'vitest'
import { search } from './exerciseRepository'

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
