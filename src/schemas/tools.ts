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
  // 部位（任意）。AI が推定して渡す。不正値でも追加自体は失敗させたくないので
  // ここでは緩く受け、executor 側で exerciseCategorySchema により正規化する。
  category: z.string().optional(),
})

export const addExerciseToSessionArgsSchema = z.object({
  exerciseName: z.string().trim().min(1),
  exerciseId: z.string().optional(),
  category: z.string().optional(),
  sets: z.array(workoutSetSchema).optional(),
})
