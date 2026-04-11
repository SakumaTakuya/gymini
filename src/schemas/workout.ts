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

export type ExerciseCardState = 'collapsed' | 'idle' | 'recording'

export type DraftExercise = {
  exerciseId: string
  exerciseName: string
  sets: WorkoutSet[]
  pendingSet: WorkoutSet | null
  cardState: ExerciseCardState
}
