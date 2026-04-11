import { z } from 'zod'
import { workoutSchema } from '../schemas/workout'
import type { Workout, WorkoutInput } from '../schemas/workout'
import { nowISODateTimeString } from '../schemas/date'
import type { DateString } from '../schemas/date'

const STORAGE_KEY = 'gymini:workouts'

function getAll(): Workout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const result = z.array(workoutSchema).safeParse(parsed)
    if (!result.success) return []
    return result.data as Workout[]
  } catch {
    return []
  }
}

function saveAll(workouts: Workout[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
  } catch {
    // T-002: localStorage write failure silently ignored
  }
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
