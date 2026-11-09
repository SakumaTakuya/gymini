import { describe, it, expect } from 'vitest'
import { buildHistoryResponse } from './historyResponder'
import { formatSetsSummary } from './formatSets'
import type { Workout } from '../../schemas/workout'
import type { DateString, ISODateTimeString } from '../../schemas/date'

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
