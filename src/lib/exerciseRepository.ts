import type { Exercise } from '../types'

const STORAGE_KEY = 'gymini:exercises'

function getAll(): Exercise[] {
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
