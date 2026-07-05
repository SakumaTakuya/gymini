import { z } from 'zod'
import type { DateString } from '../schemas/date'
import { workoutSetSchema, type WorkoutSet } from '../schemas/workout'
import {
  exerciseCategorySchema,
  type ExerciseCategory,
} from '../schemas/exercise'
import {
  saveWorkoutArgsSchema,
  addExerciseArgsSchema,
  addExerciseToSessionArgsSchema,
} from '../schemas/tools'
import type {
  ExerciseBreakdown,
  SummaryPeriod,
  WorkoutSummary,
} from '../types/chat'
import * as ExerciseRepository from './exerciseRepository'
import * as WorkoutRepository from './workoutRepository'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'

export type ToolExecutionResult = {
  success: boolean
  data?: unknown
  error?: string
}

const DEFAULT_RECENT_COUNT = 5

// AI が渡す category を安全に正規化する。未指定・不正値のときは undefined を返し、
// ExerciseRepository.create 側の既定（'unassigned'）に委ねる。こうすることで、
// 部位のハルシネーションが種目追加そのものを失敗させないようにする。
function normalizeCategory(raw: string | undefined): ExerciseCategory | undefined {
  if (raw === undefined) return undefined
  const result = exerciseCategorySchema.safeParse(raw)
  return result.success ? result.data : undefined
}

export function executeReadTool(
  name: string,
  args: Record<string, unknown>,
): ToolExecutionResult {
  switch (name) {
    case 'getRecentWorkouts': {
      const count =
        typeof args.count === 'number' && args.count > 0
          ? Math.floor(args.count)
          : DEFAULT_RECENT_COUNT
      const all = WorkoutRepository.listByDateDesc()
      return { success: true, data: all.slice(0, count) }
    }
    case 'getWorkoutsByExercise': {
      const exerciseName = args.exerciseName
      if (typeof exerciseName !== 'string' || exerciseName.trim() === '') {
        return { success: false, error: 'INVALID_ARGS' }
      }
      const query = exerciseName.toLowerCase()
      const matched = WorkoutRepository.listByDateDesc().filter((w) =>
        w.exercises.some((e) => e.exerciseName.toLowerCase().includes(query)),
      )
      return { success: true, data: matched }
    }
    case 'getWorkoutsByDate': {
      const date = args.date
      if (typeof date !== 'string') {
        return { success: false, error: 'INVALID_ARGS' }
      }
      const workouts = WorkoutRepository.listByDate(date as DateString)
      return { success: true, data: workouts }
    }
    case 'getWorkoutSummary': {
      const periodType = args.periodType
      const startDate = args.startDate
      const endDate = args.endDate
      if (
        (periodType !== 'week' && periodType !== 'month') ||
        typeof startDate !== 'string' ||
        typeof endDate !== 'string'
      ) {
        return { success: false, error: 'INVALID_ARGS' }
      }
      const summary = buildWorkoutSummary(
        periodType,
        startDate as DateString,
        endDate as DateString,
      )
      return { success: true, data: summary }
    }
    case 'getExercises': {
      return { success: true, data: ExerciseRepository.getAll() }
    }
    default:
      return { success: false, error: `UNKNOWN_READ_TOOL:${name}` }
  }
}

export function executeWriteTool(
  name: string,
  args: Record<string, unknown>,
): ToolExecutionResult {
  switch (name) {
    case 'saveWorkout':
      return executeSaveWorkout(args)
    case 'addExercise':
      return executeAddExercise(args)
    case 'addExerciseToSession':
      return executeAddExerciseToSession(args)
    default:
      return { success: false, error: `UNKNOWN_WRITE_TOOL:${name}` }
  }
}

function executeSaveWorkout(
  args: Record<string, unknown>,
): ToolExecutionResult {
  const parsed = saveWorkoutArgsSchema.safeParse(args)
  if (!parsed.success) {
    return { success: false, error: 'INVALID_ARGS' }
  }

  const session = useWorkoutSessionStore.getState()
  if (!session.isActive) {
    return { success: false, error: 'SESSION_NOT_ACTIVE' }
  }

  const allExercises = ExerciseRepository.getAll()
  const missingExercises: string[] = []
  const resolved: Array<{
    exerciseId: string
    exerciseName: string
    sets: WorkoutSet[]
  }> = []

  for (const ex of parsed.data.exercises) {
    const exact = allExercises.find((e) => e.name === ex.exerciseName)
    if (!exact) {
      missingExercises.push(ex.exerciseName)
    } else {
      resolved.push({
        exerciseId: exact.id,
        exerciseName: exact.name,
        sets: ex.sets,
      })
    }
  }

  if (missingExercises.length > 0) {
    return {
      success: false,
      error: 'EXERCISE_NOT_FOUND',
      data: { missingExercises },
    }
  }

  for (const ex of resolved) {
    const completedSets = meaningfulSets(ex.sets)
    if (completedSets.length > 0) {
      session.addExerciseWithSets({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: completedSets,
      })
    } else {
      session.addExercise({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
      })
    }
  }

  return { success: true, data: { addedToSession: true } }
}

function executeAddExercise(
  args: Record<string, unknown>,
): ToolExecutionResult {
  const parsed = addExerciseArgsSchema.safeParse(args)
  if (!parsed.success) {
    return { success: false, error: 'INVALID_ARGS' }
  }
  try {
    const exercise = ExerciseRepository.create(
      parsed.data.name,
      normalizeCategory(parsed.data.category),
    )
    return { success: true, data: exercise }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
    if (message.startsWith('Duplicate name')) {
      return { success: false, error: 'DUPLICATE_EXERCISE' }
    }
    return { success: false, error: message }
  }
}

// A set counts as performed only when reps > 0 (weight may be 0 for bodyweight
// exercises). Sets with reps 0 — including the AI placeholder {0,0} (FR_015) and a
// half-filled {weight>0, reps:0} — are dropped so the card opens in recording state
// for manual entry instead of persisting a 0-rep set.
function meaningfulSets(
  sets: Array<{ weight: number; reps: number }>,
): Array<{ weight: number; reps: number }> {
  return sets.filter((s) => s.reps > 0)
}

// Used by pendingAction to build the UI preview; validates with workoutSetSchema
// so it stays in lockstep with addExerciseToSessionArgsSchema. undefined input is
// allowed (sets are optional) and yields null.
export function parseSetsArg(
  rawSets: unknown,
): { ok: true; sets: WorkoutSet[] | null } | { ok: false } {
  if (rawSets === undefined) return { ok: true, sets: null }
  const result = z.array(workoutSetSchema).safeParse(rawSets)
  return result.success ? { ok: true, sets: result.data } : { ok: false }
}

function executeAddExerciseToSession(
  args: Record<string, unknown>,
): ToolExecutionResult {
  const parsed = addExerciseToSessionArgsSchema.safeParse(args)
  if (!parsed.success) {
    return { success: false, error: 'INVALID_ARGS' }
  }
  const { exerciseName, exerciseId: explicitExerciseId, sets } = parsed.data
  const session = useWorkoutSessionStore.getState()
  if (!session.isActive) {
    return { success: false, error: 'SESSION_NOT_ACTIVE' }
  }

  let resolvedExerciseId: string
  if (explicitExerciseId !== undefined) {
    resolvedExerciseId = explicitExerciseId
  } else {
    // exerciseId 未指定でも既存種目名と一致すればその id を再利用する。
    // ここで解決しないと、AI が既登録種目を id 無しで指定したとき
    // create が DUPLICATE_EXERCISE で失敗してしまう。
    const existing = ExerciseRepository.getAll().find(
      (e) => e.name === exerciseName,
    )
    if (existing) {
      resolvedExerciseId = existing.id
    } else {
      try {
        const created = ExerciseRepository.create(
          exerciseName,
          normalizeCategory(parsed.data.category),
        )
        resolvedExerciseId = created.id
      } catch (e) {
        const message = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
        if (message.startsWith('Duplicate name')) {
          return { success: false, error: 'DUPLICATE_EXERCISE' }
        }
        return { success: false, error: message }
      }
    }
  }

  if (session.draftExercises.some((e) => e.exerciseId === resolvedExerciseId)) {
    return { success: false, error: 'EXERCISE_ALREADY_IN_SESSION' }
  }

  const completedSets = sets ? meaningfulSets(sets) : []
  if (completedSets.length > 0) {
    session.addExerciseWithSets({
      exerciseId: resolvedExerciseId,
      exerciseName,
      sets: completedSets,
    })
  } else {
    session.addExercise({
      exerciseId: resolvedExerciseId,
      exerciseName,
    })
  }
  return {
    success: true,
    data: { exerciseId: resolvedExerciseId, exerciseName },
  }
}

function buildWorkoutSummary(
  periodType: 'week' | 'month',
  startDate: DateString,
  endDate: DateString,
): WorkoutSummary {
  const workouts = WorkoutRepository.listByDateDesc().filter(
    (w) => w.date >= startDate && w.date <= endDate,
  )
  const period: SummaryPeriod = {
    type: periodType,
    startDate,
    endDate,
  }

  const byExercise = new Map<string, ExerciseBreakdown>()
  let totalSets = 0

  for (const w of workouts) {
    for (const ex of w.exercises) {
      totalSets += ex.sets.length
      const existing = byExercise.get(ex.exerciseName)
      const maxWeight = Math.max(
        existing?.maxWeight ?? 0,
        ...ex.sets.map((s) => s.weight),
      )
      const totalReps =
        (existing?.totalReps ?? 0) +
        ex.sets.reduce((sum, s) => sum + s.reps, 0)
      const sessionCount = (existing?.sessionCount ?? 0) + 1
      const totalSetsForEx = (existing?.totalSets ?? 0) + ex.sets.length
      byExercise.set(ex.exerciseName, {
        exerciseName: ex.exerciseName,
        sessionCount,
        totalSets: totalSetsForEx,
        maxWeight,
        totalReps,
      })
    }
  }

  return {
    period,
    totalSessions: workouts.length,
    totalSets,
    exerciseBreakdown: [...byExercise.values()],
  }
}
