import { z } from 'zod'
import { workoutSetSchema } from './workout'

// Single source of truth for AI tool-call argument shapes. toolExecutor validates
// against these (replacing hand-rolled typeof checks, per A-001 Library-First) and
// they reuse workoutSetSchema so tool input is validated as strictly as persisted
// data — preventing a malformed set (e.g. negative weight) from being stored and
// later rejected by the read-time schema.

export const saveWorkoutArgsSchema = z.object({
  date: z.string(),
  exercises: z.array(
    z.object({
      exerciseName: z.string(),
      sets: z.array(workoutSetSchema),
    }),
  ),
})

export const addExerciseArgsSchema = z.object({
  name: z.string().trim().min(1),
})

export const addExerciseToSessionArgsSchema = z.object({
  exerciseName: z.string().trim().min(1),
  exerciseId: z.string().optional(),
  sets: z.array(workoutSetSchema).optional(),
})
