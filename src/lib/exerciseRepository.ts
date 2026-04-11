import type { Exercise } from '../types'

const STORAGE_KEY = 'gymini:exercises'

function load(): Exercise[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Exercise[]
  } catch {
    return []
  }
}

function save(exercises: Exercise[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises))
  } catch {
    // T-002: localStorage 書き込み失敗時は何もしない
  }
}

export function getAll(): Exercise[] {
  return load()
}

export function search(query: string): Exercise[] {
  const trimmed = query.trim()
  const all = load()
  if (trimmed === '') return all
  const lower = trimmed.toLowerCase()
  return all.filter((e) => e.name.toLowerCase().includes(lower))
}

export function create(name: string): Exercise {
  const trimmed = name.trim()
  if (trimmed === '') {
    throw new Error('Exercise name is empty')
  }
  const all = load()
  if (all.some((e) => e.name === trimmed)) {
    throw new Error(`Duplicate name: ${trimmed}`)
  }
  const exercise: Exercise = { id: crypto.randomUUID(), name: trimmed }
  save([...all, exercise])
  return exercise
}

export function update(id: string, name: string): Exercise {
  const trimmed = name.trim()
  if (trimmed === '') {
    throw new Error('Exercise name is empty')
  }
  const all = load()
  const index = all.findIndex((e) => e.id === id)
  if (index === -1) {
    throw new Error(`Exercise not found: ${id}`)
  }
  if (all.some((e) => e.id !== id && e.name === trimmed)) {
    throw new Error(`Duplicate name: ${trimmed}`)
  }
  const updated: Exercise = { ...all[index], name: trimmed }
  all[index] = updated
  save(all)
  return updated
}

export function remove(id: string): void {
  const all = load()
  const filtered = all.filter((e) => e.id !== id)
  if (filtered.length !== all.length) {
    save(filtered)
  }
}
