import { describe, it, expect } from 'vitest'
import { queryKeys } from './queryKeys'
import type { DateString } from '../schemas/date'

describe('queryKeys', () => {
  it('workoutDates が年と月を含むタプルを返す', () => {
    expect(queryKeys.workoutDates(2026, 4)).toEqual(['workoutDates', 2026, 4])
  })

  it('workoutsForDate が日付を含むタプルを返す', () => {
    const date = '2026-04-12' as DateString
    expect(queryKeys.workoutsForDate(date)).toEqual([
      'workoutsForDate',
      '2026-04-12',
    ])
  })

  it('workoutsForDate が null を処理する', () => {
    expect(queryKeys.workoutsForDate(null)).toEqual(['workoutsForDate', null])
  })
})
