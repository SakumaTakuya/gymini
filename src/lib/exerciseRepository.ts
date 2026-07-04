import { z } from 'zod'
import { exerciseSchema } from '../schemas/exercise'
import type { Exercise } from '../schemas/exercise'
import { safeGetItem, safeSetItem } from './storage'

// 他モジュール（useExercises の storage イベント購読）と共有する唯一のキー定義。
export const EXERCISES_STORAGE_KEY = 'gymini:exercises'
const STORAGE_KEY = EXERCISES_STORAGE_KEY

function load(): Exercise[] {
  const raw = safeGetItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const result = z.array(exerciseSchema).safeParse(JSON.parse(raw))
    return result.success ? result.data : []
  } catch {
    return []
  }
}

function save(exercises: Exercise[]): void {
  safeSetItem(STORAGE_KEY, JSON.stringify(exercises))
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
