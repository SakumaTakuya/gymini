import { describe, it, expect } from 'vitest'
import { buildHistoryResponse } from './historyResponder'
import { formatSetsSummary } from './formatSets'
import type { Workout } from '../../schemas/workout'
import type { DateString, ISODateTimeString } from '../../schemas/date'
import type { ExerciseCategory } from '../../schemas/exercise'

function workout(
  date: string,
  exercises: Array<{
    exerciseName: string
    sets: Array<{ weight: number; reps: number }>
  }>,
): Workout {
  return {
    id: `w-${date}-${exercises.map((e) => e.exerciseName).join('-')}`,
    date: date as DateString,
    exercises: exercises.map((e, i) => ({
      exerciseId: `ex-${i}`,
      exerciseName: e.exerciseName,
      sets: e.sets,
    })),
    startedAt: `${date}T10:00:00+09:00` as ISODateTimeString,
    endedAt: `${date}T11:00:00+09:00` as ISODateTimeString,
    createdAt: `${date}T11:00:00+09:00` as ISODateTimeString,
    updatedAt: `${date}T11:00:00+09:00` as ISODateTimeString,
  }
}

const TODAY = '2026-11-09' as DateString
const WORKOUTS: Workout[] = [
  workout('2026-11-08', [
    {
      exerciseName: 'ベンチプレス',
      sets: [
        { weight: 60, reps: 10 },
        { weight: 60, reps: 9 },
        { weight: 60, reps: 8 },
      ],
    },
    { exerciseName: '懸垂', sets: [{ weight: 0, reps: 10 }] },
  ]),
  workout('2026-11-05', [
    {
      exerciseName: 'ベンチプレス',
      sets: [
        { weight: 55, reps: 12 },
        { weight: 55, reps: 12 },
        { weight: 55, reps: 12 },
      ],
    },
  ]),
  workout('2026-11-02', [
    { exerciseName: 'スクワット', sets: [{ weight: 80, reps: 5 }] },
  ]),
]
const NAMES = ['ベンチプレス', 'スクワット', '懸垂']

describe('formatSetsSummary', () => {
  it('同一セットは ×Nセット に畳む', () => {
    expect(
      formatSetsSummary([
        { weight: 55, reps: 12 },
        { weight: 55, reps: 12 },
        { weight: 55, reps: 12 },
      ]),
    ).toBe('55kg×12回 ×3セット')
  })

  it('異なるセットは列挙する', () => {
    expect(
      formatSetsSummary([
        { weight: 60, reps: 10 },
        { weight: 60, reps: 9 },
      ]),
    ).toBe('60kg×10回、60kg×9回')
  })

  it('重量 0 は自重と表示する', () => {
    expect(formatSetsSummary([{ weight: 0, reps: 10 }])).toBe('自重 10回')
  })

  it('空配列は空文字を返す', () => {
    expect(formatSetsSummary([])).toBe('')
  })
})

describe('buildHistoryResponse', () => {
  it('種目名と日付ヒントがあれば両方で絞った記録を返す', () => {
    const res = buildHistoryResponse(
      '昨日ベンチ何kgだった？',
      WORKOUTS,
      NAMES,
      TODAY,
    )
    expect(res).toContain('昨日のベンチプレスの記録です')
    expect(res).toContain('60kg×10回、60kg×9回、60kg×8回')
    // 昨日の分だけを返し、11/5 の分は含めない
    expect(res).not.toContain('55kg')
  })

  it('マスターから消えた種目名でも、保存済みの記録の名前で特定できる', () => {
    // 種目マスターが空（改名・削除済み）でも、ワークアウトに残る
    // 名前スナップショットから言及を解決する
    const res = buildHistoryResponse('昨日ベンチ何kgだった？', WORKOUTS, [], TODAY)
    expect(res).toContain('昨日のベンチプレスの記録です')
    expect(res).toContain('60kg×10回、60kg×9回、60kg×8回')
    expect(res).not.toContain('懸垂')
    const res2 = buildHistoryResponse('ベンチの記録は？', WORKOUTS, [], TODAY)
    expect(res2).toContain('ベンチプレスの直近の記録です')
  })

  it('同じ日に同種目のセッションが複数あれば全件返す', () => {
    const sameDay: Workout[] = [
      workout('2026-11-08', [
        { exerciseName: 'ベンチプレス', sets: [{ weight: 60, reps: 10 }] },
      ]),
      workout('2026-11-08', [
        { exerciseName: 'ベンチプレス', sets: [{ weight: 70, reps: 5 }] },
      ]),
      ...WORKOUTS.slice(1),
    ]
    const res = buildHistoryResponse(
      '昨日ベンチ何kgだった？',
      sameDay,
      NAMES,
      TODAY,
    )
    expect(res).toContain('昨日のベンチプレスの記録です')
    expect(res).toContain('60kg×10回')
    expect(res).toContain('70kg×5回')
  })

  it('種目名だけならその種目の直近記録を返す', () => {
    const res = buildHistoryResponse(
      'ベンチの前回の記録は？',
      WORKOUTS,
      NAMES,
      TODAY,
    )
    expect(res).toContain('ベンチプレスの直近の記録です')
    expect(res).toContain('11/8')
    expect(res).toContain('60kg×10回、60kg×9回、60kg×8回')
    expect(res).toContain('11/5')
    expect(res).toContain('55kg×12回 ×3セット')
  })

  it('日付ヒントの日にその種目の記録がなければその旨を返す', () => {
    const res = buildHistoryResponse(
      '今日ベンチやった？',
      WORKOUTS,
      NAMES,
      TODAY,
    )
    expect(res).toBe('今日のベンチプレスの記録はありません。')
  })

  it('種目の記録がなければその旨を返す', () => {
    const res = buildHistoryResponse(
      'デッドリフトの前回は？',
      WORKOUTS,
      [...NAMES, 'デッドリフト'],
      TODAY,
    )
    expect(res).toBe('デッドリフトの記録はまだありません。')
  })

  it('日付ヒント（昨日）があればその日の記録を返す', () => {
    const res = buildHistoryResponse('昨日の記録見せて', WORKOUTS, NAMES, TODAY)
    expect(res).toContain('昨日')
    expect(res).toContain('ベンチプレス')
    expect(res).toContain('懸垂')
  })

  it('日付ヒントの日に記録がなければその旨を返す', () => {
    const res = buildHistoryResponse('今日の記録は？', WORKOUTS, NAMES, TODAY)
    expect(res).toBe('今日の記録はありません。')
  })

  it('ヒントがなければ直近の記録を返す', () => {
    const res = buildHistoryResponse('最近のトレーニング教えて', WORKOUTS, NAMES, TODAY)
    expect(res).toContain('直近')
    expect(res).toContain('11/8')
    expect(res).toContain('ベンチプレス')
  })

  it('記録が1件もなければその旨を返す', () => {
    expect(buildHistoryResponse('最近の記録は？', [], NAMES, TODAY)).toBe(
      'まだ記録がありません。',
    )
  })
})

describe('buildHistoryResponse: 期間・部位フィルタ', () => {
  function workoutWithIds(
    date: string,
    exercises: Array<{
      id: string
      exerciseName: string
      sets: Array<{ weight: number; reps: number }>
    }>,
  ): Workout {
    return {
      id: `w-${date}-${exercises.map((e) => e.id).join('-')}`,
      date: date as DateString,
      exercises: exercises.map((e) => ({
        exerciseId: e.id,
        exerciseName: e.exerciseName,
        sets: e.sets,
      })),
      startedAt: `${date}T10:00:00+09:00` as ISODateTimeString,
      endedAt: `${date}T11:00:00+09:00` as ISODateTimeString,
      createdAt: `${date}T11:00:00+09:00` as ISODateTimeString,
      updatedAt: `${date}T11:00:00+09:00` as ISODateTimeString,
    }
  }
  const CATEGORY_BY_ID = new Map<string, ExerciseCategory>([
    ['ex-bench', 'chest'],
    ['ex-squat', 'legs'],
    ['ex-legpress', 'legs'],
  ])
  const PERIOD_WORKOUTS: Workout[] = [
    workoutWithIds('2026-11-09', [
      { id: 'ex-bench', exerciseName: 'ベンチプレス', sets: [{ weight: 60, reps: 10 }] },
    ]),
    workoutWithIds('2026-11-05', [
      { id: 'ex-squat', exerciseName: 'スクワット', sets: [{ weight: 80, reps: 5 }] },
      { id: 'ex-bench', exerciseName: 'ベンチプレス', sets: [{ weight: 65, reps: 8 }] },
    ]),
    workoutWithIds('2026-11-02', [
      { id: 'ex-legpress', exerciseName: 'レッグプレス', sets: [{ weight: 100, reps: 10 }] },
    ]),
    workoutWithIds('2026-10-20', [
      { id: 'ex-squat', exerciseName: 'スクワット', sets: [{ weight: 70, reps: 5 }] },
    ]),
  ]
  const PERIOD_NAMES = ['ベンチプレス', 'スクワット', 'レッグプレス']

  it('「今月の脚の日いつ？」は今月の脚種目だけを日付付きで返す', () => {
    const res = buildHistoryResponse(
      '今月の脚の日いつ？',
      PERIOD_WORKOUTS,
      PERIOD_NAMES,
      TODAY,
      CATEGORY_BY_ID,
    )
    expect(res).toContain('今月の脚の記録です')
    expect(res).toContain('11/5')
    expect(res).toContain('スクワット')
    expect(res).toContain('11/2')
    expect(res).toContain('レッグプレス')
    // 胸種目と先月分は含めない
    expect(res).not.toContain('ベンチプレス')
    expect(res).not.toContain('10/20')
  })

  it('「先月の脚の記録は？」は先月の脚種目だけを返す', () => {
    const res = buildHistoryResponse(
      '先月の脚の記録は？',
      PERIOD_WORKOUTS,
      PERIOD_NAMES,
      TODAY,
      CATEGORY_BY_ID,
    )
    expect(res).toContain('先月の脚の記録です')
    expect(res).toContain('10/20')
    expect(res).toContain('70kg×5回')
    expect(res).not.toContain('11/5')
  })

  it('マスターから削除済みの種目も、名前スナップショットから部位を推定して部位フィルタに含める', () => {
    const deletedWorkouts: Workout[] = [
      workoutWithIds('2026-11-04', [
        // CATEGORY_BY_ID に無い id = マスター削除済み。スナップショット名だけが残る
        { id: 'ex-deleted', exerciseName: 'レッグプレス', sets: [{ weight: 90, reps: 10 }] },
      ]),
    ]
    const res = buildHistoryResponse(
      '今月の脚の日いつ？',
      deletedWorkouts,
      PERIOD_NAMES,
      TODAY,
      CATEGORY_BY_ID,
    )
    expect(res).toContain('今月の脚の記録です')
    expect(res).toContain('11/4')
    expect(res).toContain('レッグプレス')
  })

  it('マスターで未分類（unassigned）の種目も、名前から部位を推定して部位フィルタに含める', () => {
    const unassignedById = new Map<string, ExerciseCategory>([
      ['ex-squat', 'unassigned'],
    ])
    const unassignedWorkouts: Workout[] = [
      workoutWithIds('2026-11-06', [
        { id: 'ex-squat', exerciseName: 'スクワット', sets: [{ weight: 80, reps: 5 }] },
      ]),
    ]
    const res = buildHistoryResponse(
      '今月の脚の日いつ？',
      unassignedWorkouts,
      PERIOD_NAMES,
      TODAY,
      unassignedById,
    )
    expect(res).toContain('今月の脚の記録です')
    expect(res).toContain('11/6')
    expect(res).toContain('スクワット')
  })

  it('「今週の記録見せて」は今週（月曜始まり）の分だけを返す', () => {
    const res = buildHistoryResponse(
      '今週の記録見せて',
      PERIOD_WORKOUTS,
      PERIOD_NAMES,
      TODAY,
      CATEGORY_BY_ID,
    )
    expect(res).toContain('今週の記録です')
    expect(res).toContain('11/9')
    expect(res).not.toContain('11/5')
  })

  it('部位だけの指定（脚の記録は？）は全期間から部位で絞る', () => {
    const res = buildHistoryResponse(
      '脚の記録は？',
      PERIOD_WORKOUTS,
      PERIOD_NAMES,
      TODAY,
      CATEGORY_BY_ID,
    )
    expect(res).toContain('脚の記録です')
    expect(res).toContain('スクワット')
    expect(res).toContain('レッグプレス')
    expect(res).not.toContain('ベンチプレス')
  })

  it('種目名と期間があれば期間内でも絞る', () => {
    const res = buildHistoryResponse(
      '今月のスクワットは？',
      PERIOD_WORKOUTS,
      PERIOD_NAMES,
      TODAY,
      CATEGORY_BY_ID,
    )
    expect(res).toContain('スクワットの直近の記録です')
    expect(res).toContain('11/5')
    expect(res).not.toContain('10/20')
  })

  it('期間内に種目の記録がなければその旨を返す', () => {
    const res = buildHistoryResponse(
      '先月のベンチプレスは？',
      PERIOD_WORKOUTS,
      PERIOD_NAMES,
      TODAY,
      CATEGORY_BY_ID,
    )
    expect(res).toBe('先月のベンチプレスの記録はありません。')
  })

  it('日付ヒントと部位があればその日の部位種目だけを返す', () => {
    const res = buildHistoryResponse(
      '昨日の脚トレ見せて',
      [
        workoutWithIds('2026-11-08', [
          { id: 'ex-squat', exerciseName: 'スクワット', sets: [{ weight: 80, reps: 5 }] },
          { id: 'ex-bench', exerciseName: 'ベンチプレス', sets: [{ weight: 60, reps: 10 }] },
        ]),
      ],
      PERIOD_NAMES,
      TODAY,
      CATEGORY_BY_ID,
    )
    expect(res).toContain('昨日の脚の記録です')
    expect(res).toContain('スクワット')
    expect(res).not.toContain('ベンチプレス')
  })
})
