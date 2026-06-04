import { z } from 'zod'
import { workoutSchema } from '../schemas/workout'
import type { Workout, WorkoutInput } from '../schemas/workout'
import { nowISODateTimeString } from '../schemas/date'
import type { DateString } from '../schemas/date'
import { safeGetItem, safeSetItem } from './storage'

const STORAGE_KEY = 'gymini:workouts'

function getAll(): Workout[] {
  const raw = safeGetItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const result = z.array(workoutSchema).safeParse(JSON.parse(raw))
    if (!result.success) return []
    return result.data as Workout[]
  } catch {
    return []
  }
}

function saveAll(workouts: Workout[]): void {
  safeSetItem(STORAGE_KEY, JSON.stringify(workouts))
}

export function save(input: WorkoutInput): Workout {
  const now = nowISODateTimeString()
  const workout: Workout = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  const all = getAll()
  all.push(workout)
  saveAll(all)
  return workout
}

export function remove(id: string): void {
  const all = getAll()
  const filtered = all.filter((w) => w.id !== id)
  if (filtered.length !== all.length) {
    saveAll(filtered)
  }
}

export function getById(id: string): Workout | undefined {
  return getAll().find((w) => w.id === id)
}

export function listByDateDesc(): Workout[] {
  return getAll().sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))
}

export function listByDate(date: DateString): Workout[] {
  return getAll().filter((w) => w.date === date)
}
