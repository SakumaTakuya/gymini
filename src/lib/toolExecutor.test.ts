import { beforeEach, describe, expect, test, vi } from 'vitest'
import { executeReadTool, executeWriteTool } from './toolExecutor'
import * as ExerciseRepository from './exerciseRepository'
import * as WorkoutRepository from './workoutRepository'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import type { Workout } from '../schemas/workout'
import type { Exercise } from '../types'
import type { DateString, ISODateTimeString } from '../schemas/date'

vi.mock('./exerciseRepository')
vi.mock('./workoutRepository')

function makeExercise(name: string, id?: string): Exercise {
  return { id: id ?? `ex-${name}`, name }
}

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  const now = '2026-04-18T12:00:00+09:00' as ISODateTimeString
  return {
    id: overrides.id ?? 'w-1',
    date: (overrides.date ?? '2026-04-18') as DateString,
    exercises: overrides.exercises ?? [
      { exerciseId: 'ex-1', exerciseName: 'ベンチプレス', sets: [{ weight: 60, reps: 10 }] },
    ],
    startedAt: overrides.startedAt ?? now,
    endedAt: overrides.endedAt ?? now,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  }
}

describe('executeReadTool', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('getRecentWorkouts', () => {
    test('returns latest n workouts with default count', () => {
      const workouts = [makeWorkout({ id: 'w-1' }), makeWorkout({ id: 'w-2' })]
      vi.mocked(WorkoutRepository.listByDateDesc).mockReturnValue(workouts)
      const result = executeReadTool('getRecentWorkouts', {})
      expect(result.success).toBe(true)
      expect(result.data).toEqual(workouts)
    })

    test('applies custom count', () => {
      const workouts = Array.from({ length: 10 }, (_, i) =>
        makeWorkout({ id: `w-${i}` }),
      )
      vi.mocked(WorkoutRepository.listByDateDesc).mockReturnValue(workouts)
      const result = executeReadTool('getRecentWorkouts', { count: 3 })
      expect((result.data as Workout[]).length).toBe(3)
    })
  })

  describe('getWorkoutsByExercise', () => {
    test('filters by exercise name (case-insensitive partial match)', () => {
      const wa = makeWorkout({
        id: 'wa',
        exercises: [
          { exerciseId: 'ex-1', exerciseName: 'ベンチプレス', sets: [] },
        ],
      })
      const wb = makeWorkout({
        id: 'wb',
        exercises: [
          { exerciseId: 'ex-2', exerciseName: 'スクワット', sets: [] },
        ],
      })
      vi.mocked(WorkoutRepository.listByDateDesc).mockReturnValue([wa, wb])
      const result = executeReadTool('getWorkoutsByExercise', {
        exerciseName: 'ベンチ',
      })
      expect(result.success).toBe(true)
      expect((result.data as Workout[]).map((w) => w.id)).toEqual(['wa'])
    })

    test('returns INVALID_ARGS when exerciseName is empty', () => {
      const result = executeReadTool('getWorkoutsByExercise', { exerciseName: '' })
      expect(result).toEqual({ success: false, error: 'INVALID_ARGS' })
    })
  })

  describe('getWorkoutsByDate', () => {
    test('returns workouts on given date', () => {
      const w = makeWorkout({ date: '2026-04-18' as DateString })
      vi.mocked(WorkoutRepository.listByDate).mockReturnValue([w])
      const result = executeReadTool('getWorkoutsByDate', { date: '2026-04-18' })
      expect(result.success).toBe(true)
      expect(result.data).toEqual([w])
    })

    test('returns INVALID_ARGS when date missing', () => {
      const result = executeReadTool('getWorkoutsByDate', {})
      expect(result.success).toBe(false)
    })
  })

  describe('getWorkoutSummary', () => {
    test('aggregates workouts in date range', () => {
      const w = makeWorkout({
        date: '2026-04-18' as DateString,
        exercises: [
          {
            exerciseId: 'ex-1',
            exerciseName: 'ベンチプレス',
            sets: [
              { weight: 60, reps: 10 },
              { weight: 65, reps: 8 },
            ],
          },
        ],
      })
      vi.mocked(WorkoutRepository.listByDateDesc).mockReturnValue([w])
      const result = executeReadTool('getWorkoutSummary', {
        periodType: 'week',
        startDate: '2026-04-12',
        endDate: '2026-04-18',
      })
      expect(result.success).toBe(true)
      const summary = result.data as {
        totalSessions: number
        totalSets: number
        exerciseBreakdown: Array<{ maxWeight: number; totalReps: number }>
      }
      expect(summary.totalSessions).toBe(1)
      expect(summary.totalSets).toBe(2)
      expect(summary.exerciseBreakdown[0].maxWeight).toBe(65)
      expect(summary.exerciseBreakdown[0].totalReps).toBe(18)
    })

    test('rejects invalid periodType', () => {
      const result = executeReadTool('getWorkoutSummary', {
        periodType: 'year',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('getExercises', () => {
    test('returns all exercises', () => {
      const list = [makeExercise('ベンチプレス'), makeExercise('スクワット')]
      vi.mocked(ExerciseRepository.getAll).mockReturnValue(list)
      const result = executeReadTool('getExercises', {})
      expect(result).toEqual({ success: true, data: list })
    })
  })

  test('unknown tool returns error', () => {
    const result = executeReadTool('unknownTool', {})
    expect(result.success).toBe(false)
    expect(result.error).toContain('UNKNOWN_READ_TOOL')
  })
})

describe('executeWriteTool', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useWorkoutSessionStore.setState({
      isActive: false,
      startedAt: null,
      date: null,
      draftExercises: [],
    })
  })

  describe('saveWorkout', () => {
    test('セッションなし: startSession を呼んで draftExercises にセット済み種目を追加する', () => {
      vi.mocked(ExerciseRepository.getAll).mockReturnValue([
        makeExercise('ベンチプレス', 'ex-1'),
      ])
      const result = executeWriteTool('saveWorkout', {
        date: '2026-04-18',
        exercises: [
          {
            exerciseName: 'ベンチプレス',
            sets: [{ weight: 60, reps: 10 }],
          },
        ],
      })
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ addedToSession: true })
      expect(WorkoutRepository.save).not.toHaveBeenCalled()
      const state = useWorkoutSessionStore.getState()
      expect(state.isActive).toBe(true)
      expect(state.date).toBe('2026-04-18')
      expect(state.draftExercises).toHaveLength(1)
      expect(state.draftExercises[0].exerciseId).toBe('ex-1')
      expect(state.draftExercises[0].sets).toEqual([{ weight: 60, reps: 10 }])
      expect(state.draftExercises[0].cardState).toBe('idle')
    })

    test('セッションあり: startSession を呼ばずに既存セッションに種目を追加する', () => {
      useWorkoutSessionStore.getState().startSession('2026-04-18' as DateString)
      vi.mocked(ExerciseRepository.getAll).mockReturnValue([
        makeExercise('スクワット', 'ex-2'),
      ])
      const result = executeWriteTool('saveWorkout', {
        date: '2026-04-18',
        exercises: [
          {
            exerciseName: 'スクワット',
            sets: [{ weight: 100, reps: 5 }],
          },
        ],
      })
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ addedToSession: true })
      expect(WorkoutRepository.save).not.toHaveBeenCalled()
      const state = useWorkoutSessionStore.getState()
      expect(state.draftExercises).toHaveLength(1)
      expect(state.draftExercises[0].exerciseId).toBe('ex-2')
      expect(state.draftExercises[0].sets).toEqual([{ weight: 100, reps: 5 }])
    })

    test('returns EXERCISE_NOT_FOUND when a name is missing', () => {
      vi.mocked(ExerciseRepository.getAll).mockReturnValue([])
      const result = executeWriteTool('saveWorkout', {
        date: '2026-04-18',
        exercises: [
          { exerciseName: 'インクラインダンベルカール', sets: [] },
        ],
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('EXERCISE_NOT_FOUND')
      expect(result.data).toEqual({
        missingExercises: ['インクラインダンベルカール'],
      })
      expect(WorkoutRepository.save).not.toHaveBeenCalled()
    })

    test('returns INVALID_ARGS for malformed input', () => {
      const result = executeWriteTool('saveWorkout', { date: null })
      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_ARGS')
    })
  })

  describe('addExercise', () => {
    test('creates new exercise', () => {
      const created = makeExercise('新しい種目', 'ex-new')
      vi.mocked(ExerciseRepository.create).mockReturnValue(created)
      const result = executeWriteTool('addExercise', { name: '新しい種目' })
      expect(result.success).toBe(true)
      expect(result.data).toBe(created)
    })

    test('returns DUPLICATE_EXERCISE when repository throws duplicate', () => {
      vi.mocked(ExerciseRepository.create).mockImplementation(() => {
        throw new Error('Duplicate name: ベンチプレス')
      })
      const result = executeWriteTool('addExercise', { name: 'ベンチプレス' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('DUPLICATE_EXERCISE')
    })

    test('rejects empty name', () => {
      const result = executeWriteTool('addExercise', { name: '' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_ARGS')
    })
  })

  describe('addExerciseToSession', () => {
    test('returns SESSION_NOT_ACTIVE when no active session', () => {
      useWorkoutSessionStore.setState({
        isActive: false,
        startedAt: null,
        date: null,
        draftExercises: [],
      })
      const result = executeWriteTool('addExerciseToSession', {
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('SESSION_NOT_ACTIVE')
    })

    test('adds exercise when session is active', () => {
      useWorkoutSessionStore.getState().startSession()
      const addSpy = vi.spyOn(useWorkoutSessionStore.getState(), 'addExercise')
      const result = executeWriteTool('addExerciseToSession', {
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
      })
      expect(result.success).toBe(true)
      expect(addSpy).toHaveBeenCalledWith({
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
      })
    })
  })

  test('unknown write tool returns error', () => {
    const result = executeWriteTool('unknownWrite', {})
    expect(result.success).toBe(false)
    expect(result.error).toContain('UNKNOWN_WRITE_TOOL')
  })
})
