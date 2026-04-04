import type { Exercise } from '../types'

const STORAGE_KEY = 'gymini:exercises'

export function getAll(): Exercise[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Exercise[]) : []
  } catch {
    return []
  }
}

export function search(query: string): Exercise[] {
  const all = getAll()
  if (!query) return all
  const lower = query.toLowerCase()
  return all.filter((e) => e.name.toLowerCase().includes(lower))
}

export function create(name: string): Exercise {
  const all = getAll()
  if (all.some((e) => e.name === name)) {
    throw new Error(`種目「${name}」は既に登録されています`)
  }
  const exercise: Exercise = {
    id: crypto.randomUUID(),
    name,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, exercise]))
  return exercise
}

export function remove(id: string): void {
  const all = getAll()
  const filtered = all.filter((e) => e.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}
