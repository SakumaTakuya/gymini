import type { WorkoutRecord, WorkoutInput } from '../types'

const STORAGE_KEY = 'gymini:workouts'

interface StoredWorkoutRecord extends WorkoutRecord {
  createdAt: string
  updatedAt: string
}

function getAll(): StoredWorkoutRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredWorkoutRecord[]) : []
  } catch {
    return []
  }
}

function saveAll(workouts: StoredWorkoutRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
  } catch {
    // NFR-002: ignore write errors
  }
}

export function getById(id: string): StoredWorkoutRecord | undefined {
  return getAll().find((w) => w.id === id)
}

export function listByDateDesc(): StoredWorkoutRecord[] {
  return getAll().sort((a, b) => b.date.localeCompare(a.date))
}

export function listByDate(date: string): StoredWorkoutRecord[] {
  return getAll().filter((w) => w.date === date)
}

export function create(input: WorkoutInput): StoredWorkoutRecord {
  const now = new Date().toISOString()
  const workout: StoredWorkoutRecord = {
    ...input,
    exercises: input.exercises,
    memo: input.memo ?? '',
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  const all = getAll()
  all.push(workout)
  saveAll(all)
  return workout
}

export function update(id: string, input: WorkoutInput): StoredWorkoutRecord | null {
  const all = getAll()
  const index = all.findIndex((w) => w.id === id)
  if (index === -1) return null
  const existing = all[index]
  const updated: StoredWorkoutRecord = {
    ...existing,
    ...input,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  }
  all[index] = updated
  saveAll(all)
  return updated
}

export function remove(id: string): void {
  const all = getAll().filter((w) => w.id !== id)
  saveAll(all)
}
