import type { DateString } from '../schemas/date'
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
  const date = args.date
  const exercises = args.exercises
  if (typeof date !== 'string' || !Array.isArray(exercises)) {
    return { success: false, error: 'INVALID_ARGS' }
  }

  const session = useWorkoutSessionStore.getState()
  if (!session.isActive) {
    return { success: false, error: 'SESSION_NOT_ACTIVE' }
  }

  type SaveExerciseInput = {
    exerciseName: string
    sets: Array<{ weight: number; reps: number }>
  }

  const inputs: SaveExerciseInput[] = []
  for (const e of exercises) {
    if (
      typeof e !== 'object' ||
      e === null ||
      typeof (e as { exerciseName?: unknown }).exerciseName !== 'string' ||
      !Array.isArray((e as { sets?: unknown }).sets)
    ) {
      return { success: false, error: 'INVALID_ARGS' }
    }
    inputs.push(e as SaveExerciseInput)
  }

  const allExercises = ExerciseRepository.getAll()
  const missingExercises: string[] = []
  const resolved: Array<{
    exerciseId: string
    exerciseName: string
    sets: Array<{ weight: number; reps: number }>
  }> = []

  for (const ex of inputs) {
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
    session.addExerciseWithSets({ ...ex, origin: 'ai-suggested' })
  }

  return { success: true, data: { addedToSession: true } }
}

function executeAddExercise(
  args: Record<string, unknown>,
): ToolExecutionResult {
  const name = args.name
  if (typeof name !== 'string' || name.trim() === '') {
    return { success: false, error: 'INVALID_ARGS' }
  }
  try {
    const exercise = ExerciseRepository.create(name)
    return { success: true, data: exercise }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
    if (message.startsWith('Duplicate name')) {
      return { success: false, error: 'DUPLICATE_EXERCISE' }
    }
    return { success: false, error: message }
  }
}

export function parseSetsArg(
  rawSets: unknown,
): { ok: true; sets: Array<{ weight: number; reps: number }> | null } | { ok: false } {
  if (rawSets === undefined) return { ok: true, sets: null }
  if (!Array.isArray(rawSets)) return { ok: false }
  const out: Array<{ weight: number; reps: number }> = []
  for (const s of rawSets) {
    if (
      typeof s !== 'object' ||
      s === null ||
      typeof (s as { weight?: unknown }).weight !== 'number' ||
      typeof (s as { reps?: unknown }).reps !== 'number'
    ) {
      return { ok: false }
    }
    out.push(s as { weight: number; reps: number })
  }
  return { ok: true, sets: out }
}

function executeAddExerciseToSession(
  args: Record<string, unknown>,
): ToolExecutionResult {
  const exerciseName = args.exerciseName
  if (typeof exerciseName !== 'string' || exerciseName.trim() === '') {
    return { success: false, error: 'INVALID_ARGS' }
  }
  const explicitExerciseId = args.exerciseId
  if (
    explicitExerciseId !== undefined &&
    typeof explicitExerciseId !== 'string'
  ) {
    return { success: false, error: 'INVALID_ARGS' }
  }
  const parsed = parseSetsArg(args.sets)
  if (!parsed.ok) {
    return { success: false, error: 'INVALID_ARGS' }
  }
  const session = useWorkoutSessionStore.getState()
  if (!session.isActive) {
    return { success: false, error: 'SESSION_NOT_ACTIVE' }
  }

  let resolvedExerciseId: string
  if (typeof explicitExerciseId === 'string') {
    resolvedExerciseId = explicitExerciseId
  } else {
    try {
      const created = ExerciseRepository.create(exerciseName)
      resolvedExerciseId = created.id
    } catch (e) {
      const message = e instanceof Error ? e.message : 'UNKNOWN_ERROR'
      if (message.startsWith('Duplicate name')) {
        return { success: false, error: 'DUPLICATE_EXERCISE' }
      }
      return { success: false, error: message }
    }
  }

  if (session.draftExercises.some((e) => e.exerciseId === resolvedExerciseId)) {
    return { success: false, error: 'EXERCISE_ALREADY_IN_SESSION' }
  }

  if (parsed.sets && parsed.sets.length > 0) {
    session.addExerciseWithSets({
      exerciseId: resolvedExerciseId,
      exerciseName,
      sets: parsed.sets,
      origin: 'ai-suggested',
    })
  } else {
    session.addExercise({
      exerciseId: resolvedExerciseId,
      exerciseName,
      origin: 'ai-suggested',
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
