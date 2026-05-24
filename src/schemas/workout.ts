import { z } from 'zod'
import { dateStringSchema, isoDateTimeSchema } from './date'
import type { DateString, ISODateTimeString } from './date'

export const workoutSetSchema = z.object({
  weight: z.number().nonnegative(),
  reps: z.number().int().nonnegative(),
})

export const workoutExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  sets: z.array(workoutSetSchema),
})

export const workoutSchema = z.object({
  id: z.string(),
  date: dateStringSchema,
  exercises: z.array(workoutExerciseSchema),
  startedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

// Derived types
export type WorkoutSet = z.infer<typeof workoutSetSchema>
export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>
export type Workout = Omit<
  z.infer<typeof workoutSchema>,
  'date' | 'startedAt' | 'endedAt' | 'createdAt' | 'updatedAt'
> & {
  date: DateString
  startedAt: ISODateTimeString
  endedAt: ISODateTimeString
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
}

export type WorkoutInput = Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>

export const exerciseCardStateSchema = z.enum([
  'collapsed',
  'idle',
  'recording',
])
export type ExerciseCardState = z.infer<typeof exerciseCardStateSchema>

export const draftExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  sets: z.array(workoutSetSchema),
  pendingSet: workoutSetSchema.nullable(),
  pendingSetDirty: z.boolean(),
  cardState: exerciseCardStateSchema,
  editingSetIndex: z.number().int().nullable(),
  timestamp: z.string(),
})

export type DraftExercise = {
  exerciseId: string
  exerciseName: string
  sets: WorkoutSet[]
  pendingSet: WorkoutSet | null
  pendingSetDirty: boolean
  cardState: ExerciseCardState
  editingSetIndex: number | null
  timestamp: ISODateTimeString
}

// Schema for the persisted workout-session slice. Validates rehydrated data so a
// corrupt/legacy payload falls back to a safe empty session instead of crashing.
export const persistedSessionSchema = z.object({
  isActive: z.boolean(),
  startedAt: z.string().nullable(),
  date: z.string().nullable(),
  draftExercises: z.array(draftExerciseSchema),
})
