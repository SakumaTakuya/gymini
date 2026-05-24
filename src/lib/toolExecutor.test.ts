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
    test('デフォルトの件数で最新 n 件のワークアウトを返す', () => {
      const workouts = [makeWorkout({ id: 'w-1' }), makeWorkout({ id: 'w-2' })]
      vi.mocked(WorkoutRepository.listByDateDesc).mockReturnValue(workouts)
      const result = executeReadTool('getRecentWorkouts', {})
      expect(result.success).toBe(true)
      expect(result.data).toEqual(workouts)
    })

    test('カスタム件数を適用する', () => {
      const workouts = Array.from({ length: 10 }, (_, i) =>
        makeWorkout({ id: `w-${i}` }),
      )
      vi.mocked(WorkoutRepository.listByDateDesc).mockReturnValue(workouts)
      const result = executeReadTool('getRecentWorkouts', { count: 3 })
      expect((result.data as Workout[]).length).toBe(3)
    })
  })

  describe('getWorkoutsByExercise', () => {
    test('種目名で（大文字小文字を区別しない部分一致で）フィルタリングする', () => {
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

    test('exerciseName が空のとき INVALID_ARGS を返す', () => {
      const result = executeReadTool('getWorkoutsByExercise', { exerciseName: '' })
      expect(result).toEqual({ success: false, error: 'INVALID_ARGS' })
    })
  })

  describe('getWorkoutsByDate', () => {
    test('指定した日付のワークアウトを返す', () => {
      const w = makeWorkout({ date: '2026-04-18' as DateString })
      vi.mocked(WorkoutRepository.listByDate).mockReturnValue([w])
      const result = executeReadTool('getWorkoutsByDate', { date: '2026-04-18' })
      expect(result.success).toBe(true)
      expect(result.data).toEqual([w])
    })

    test('date がない場合 INVALID_ARGS を返す', () => {
      const result = executeReadTool('getWorkoutsByDate', {})
      expect(result.success).toBe(false)
    })
  })

  describe('getWorkoutSummary', () => {
    test('日付範囲内のワークアウトを集計する', () => {
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

    test('不正な periodType を拒否する', () => {
      const result = executeReadTool('getWorkoutSummary', {
        periodType: 'year',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('getExercises', () => {
    test('全種目を返す', () => {
      const list = [makeExercise('ベンチプレス'), makeExercise('スクワット')]
      vi.mocked(ExerciseRepository.getAll).mockReturnValue(list)
      const result = executeReadTool('getExercises', {})
      expect(result).toEqual({ success: true, data: list })
    })
  })

  test('不明なツールはエラーを返す', () => {
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
    test('セッションなし: SESSION_NOT_ACTIVE を返し draftExercises を変更しない', () => {
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
      expect(result.success).toBe(false)
      expect(result.error).toBe('SESSION_NOT_ACTIVE')
      expect(WorkoutRepository.save).not.toHaveBeenCalled()
      const state = useWorkoutSessionStore.getState()
      expect(state.isActive).toBe(false)
      expect(state.draftExercises).toEqual([])
    })

    test('セッションあり: 既存セッションに種目を追加する', () => {
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

    test('種目名が見つからない場合 EXERCISE_NOT_FOUND を返す', () => {
      useWorkoutSessionStore.getState().startSession('2026-04-18' as DateString)
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

    test('不正な入力に対して INVALID_ARGS を返す', () => {
      const result = executeWriteTool('saveWorkout', { date: null })
      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_ARGS')
    })
  })

  describe('addExercise', () => {
    test('新しい種目を作成する', () => {
      const created = makeExercise('新しい種目', 'ex-new')
      vi.mocked(ExerciseRepository.create).mockReturnValue(created)
      const result = executeWriteTool('addExercise', { name: '新しい種目' })
      expect(result.success).toBe(true)
      expect(result.data).toBe(created)
    })

    test('リポジトリが重複エラーをスローしたとき DUPLICATE_EXERCISE を返す', () => {
      vi.mocked(ExerciseRepository.create).mockImplementation(() => {
        throw new Error('Duplicate name: ベンチプレス')
      })
      const result = executeWriteTool('addExercise', { name: 'ベンチプレス' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('DUPLICATE_EXERCISE')
    })

    test('空の name を拒否する', () => {
      const result = executeWriteTool('addExercise', { name: '' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_ARGS')
    })
  })

  describe('addExerciseToSession', () => {
    test('アクティブなセッションがない場合 SESSION_NOT_ACTIVE を返す', () => {
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

    test('セッションがアクティブのとき種目を追加する', () => {
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

    test('sets が指定されたとき addExerciseWithSets を呼んでセット込みで追加する', () => {
      useWorkoutSessionStore.getState().startSession()
      const addWithSetsSpy = vi.spyOn(
        useWorkoutSessionStore.getState(),
        'addExerciseWithSets',
      )
      const result = executeWriteTool('addExerciseToSession', {
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
        ],
      })
      expect(result.success).toBe(true)
      expect(addWithSetsSpy).toHaveBeenCalledWith({
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
        ],
      })
      const state = useWorkoutSessionStore.getState()
      expect(state.draftExercises).toHaveLength(1)
      expect(state.draftExercises[0].sets).toHaveLength(3)
      expect(state.draftExercises[0].cardState).toBe('idle')
    })

    test('プレースホルダのみ (sets:[{0,0}]) は完了セットを作らず recording の空カードにする', () => {
      useWorkoutSessionStore.getState().startSession()
      const addSpy = vi.spyOn(useWorkoutSessionStore.getState(), 'addExercise')
      const addWithSetsSpy = vi.spyOn(
        useWorkoutSessionStore.getState(),
        'addExerciseWithSets',
      )
      const result = executeWriteTool('addExerciseToSession', {
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 0, reps: 0 }],
      })
      expect(result.success).toBe(true)
      expect(addSpy).toHaveBeenCalledWith({
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
      })
      expect(addWithSetsSpy).not.toHaveBeenCalled()
      const state = useWorkoutSessionStore.getState()
      expect(state.draftExercises[0].sets).toEqual([])
      expect(state.draftExercises[0].cardState).toBe('recording')
    })

    test('実値セットとプレースホルダ混在時は実値のみを完了セットにする', () => {
      useWorkoutSessionStore.getState().startSession()
      const result = executeWriteTool('addExerciseToSession', {
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 0, reps: 0 },
        ],
      })
      expect(result.success).toBe(true)
      const state = useWorkoutSessionStore.getState()
      expect(state.draftExercises[0].sets).toEqual([{ weight: 60, reps: 10 }])
    })

    test('自重セット (weight:0, reps>0) は完了セットとして保持する', () => {
      useWorkoutSessionStore.getState().startSession()
      const result = executeWriteTool('addExerciseToSession', {
        exerciseId: 'ex-1',
        exerciseName: '懸垂',
        sets: [{ weight: 0, reps: 10 }],
      })
      expect(result.success).toBe(true)
      const state = useWorkoutSessionStore.getState()
      expect(state.draftExercises[0].sets).toEqual([{ weight: 0, reps: 10 }])
      expect(state.draftExercises[0].cardState).toBe('idle')
    })

    test('reps が 0 のセット (weight>0, reps:0) は完了セットにせず recording の空カードにする', () => {
      useWorkoutSessionStore.getState().startSession()
      const result = executeWriteTool('addExerciseToSession', {
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 60, reps: 0 }],
      })
      expect(result.success).toBe(true)
      const state = useWorkoutSessionStore.getState()
      expect(state.draftExercises[0].sets).toEqual([])
      expect(state.draftExercises[0].cardState).toBe('recording')
    })

    test('sets が空配列の場合は addExercise を呼ぶ（空 sets 付き種目は作らない）', () => {
      useWorkoutSessionStore.getState().startSession()
      const addSpy = vi.spyOn(useWorkoutSessionStore.getState(), 'addExercise')
      const addWithSetsSpy = vi.spyOn(
        useWorkoutSessionStore.getState(),
        'addExerciseWithSets',
      )
      const result = executeWriteTool('addExerciseToSession', {
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
        sets: [],
      })
      expect(result.success).toBe(true)
      expect(addSpy).toHaveBeenCalled()
      expect(addWithSetsSpy).not.toHaveBeenCalled()
    })

    test('sets に不正な要素を含む場合 INVALID_ARGS', () => {
      useWorkoutSessionStore.getState().startSession()
      const result = executeWriteTool('addExerciseToSession', {
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 'oops', reps: 10 }],
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_ARGS')
    })

    test('exerciseId 省略時はマスター追加してからセッションへ追加（旧 addExerciseAndLog 統合）', () => {
      useWorkoutSessionStore.getState().startSession()
      const created = makeExercise('ラットプルダウン', 'ex-lat')
      vi.mocked(ExerciseRepository.create).mockReturnValue(created)
      const result = executeWriteTool('addExerciseToSession', {
        exerciseName: 'ラットプルダウン',
        sets: [{ weight: 50, reps: 10 }],
      })
      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        exerciseId: 'ex-lat',
        exerciseName: 'ラットプルダウン',
      })
      expect(ExerciseRepository.create).toHaveBeenCalledWith('ラットプルダウン')
      const state = useWorkoutSessionStore.getState()
      expect(state.draftExercises).toHaveLength(1)
      expect(state.draftExercises[0].exerciseId).toBe('ex-lat')
      expect(state.draftExercises[0].sets).toEqual([{ weight: 50, reps: 10 }])
    })

    test('exerciseId 省略 + 既存名: DUPLICATE_EXERCISE を返してセッションを変更しない', () => {
      useWorkoutSessionStore.getState().startSession()
      vi.mocked(ExerciseRepository.create).mockImplementation(() => {
        throw new Error('Duplicate name: ベンチプレス')
      })
      const result = executeWriteTool('addExerciseToSession', {
        exerciseName: 'ベンチプレス',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('DUPLICATE_EXERCISE')
      expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(0)
    })

    test('exerciseId 省略 + sets 空: マスター追加 + addExercise（空 sets 種目）', () => {
      useWorkoutSessionStore.getState().startSession()
      const created = makeExercise('デッドリフト', 'ex-dl')
      vi.mocked(ExerciseRepository.create).mockReturnValue(created)
      const result = executeWriteTool('addExerciseToSession', {
        exerciseName: 'デッドリフト',
      })
      expect(result.success).toBe(true)
      expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(1)
      expect(useWorkoutSessionStore.getState().draftExercises[0].sets).toEqual([])
    })

    test('exerciseName が空文字 / 空白のみ → INVALID_ARGS', () => {
      useWorkoutSessionStore.getState().startSession()
      const result = executeWriteTool('addExerciseToSession', {
        exerciseName: '   ',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('INVALID_ARGS')
      expect(ExerciseRepository.create).not.toHaveBeenCalled()
    })

    describe('セッション内重複ガード（EXERCISE_ALREADY_IN_SESSION）', () => {
      test('exerciseId 明示 + 既に同 id が draftExercises にある → EXERCISE_ALREADY_IN_SESSION', () => {
        useWorkoutSessionStore.getState().startSession()
        useWorkoutSessionStore.getState().addExercise({
          exerciseId: 'ex-1',
          exerciseName: 'ベンチプレス',
        })
        const result = executeWriteTool('addExerciseToSession', {
          exerciseId: 'ex-1',
          exerciseName: 'ベンチプレス',
        })
        expect(result.success).toBe(false)
        expect(result.error).toBe('EXERCISE_ALREADY_IN_SESSION')
        expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(1)
      })

      test('exerciseId 明示 + sets 付き + 既存重複 → EXERCISE_ALREADY_IN_SESSION（既存 sets は書き換わらない）', () => {
        useWorkoutSessionStore.getState().startSession()
        useWorkoutSessionStore.getState().addExerciseWithSets({
          exerciseId: 'ex-1',
          exerciseName: 'ベンチプレス',
          sets: [{ weight: 60, reps: 10 }],
        })
        const result = executeWriteTool('addExerciseToSession', {
          exerciseId: 'ex-1',
          exerciseName: 'ベンチプレス',
          sets: [{ weight: 65, reps: 8 }],
        })
        expect(result.success).toBe(false)
        expect(result.error).toBe('EXERCISE_ALREADY_IN_SESSION')
        const state = useWorkoutSessionStore.getState()
        expect(state.draftExercises).toHaveLength(1)
        expect(state.draftExercises[0].sets).toEqual([{ weight: 60, reps: 10 }])
      })

      test('異なる exerciseId は重複しない（並んで正常追加）', () => {
        useWorkoutSessionStore.getState().startSession()
        useWorkoutSessionStore.getState().addExercise({
          exerciseId: 'ex-1',
          exerciseName: 'ベンチプレス',
        })
        const result = executeWriteTool('addExerciseToSession', {
          exerciseId: 'ex-2',
          exerciseName: 'スクワット',
        })
        expect(result.success).toBe(true)
        expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(2)
      })
    })
  })

  test('addExerciseAndLog ツール名は撤去済みで UNKNOWN_WRITE_TOOL', () => {
    const result = executeWriteTool('addExerciseAndLog', { name: 'ラットプルダウン' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('UNKNOWN_WRITE_TOOL')
  })

  test('不明な write ツールはエラーを返す', () => {
    const result = executeWriteTool('unknownWrite', {})
    expect(result.success).toBe(false)
    expect(result.error).toContain('UNKNOWN_WRITE_TOOL')
  })
})
