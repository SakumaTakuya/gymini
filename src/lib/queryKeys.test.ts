import { describe, it, expect } from 'vitest'
import { queryKeys } from './queryKeys'
import type { DateString } from '../schemas/date'

describe('queryKeys', () => {
  it('workoutDates returns tuple with year and month', () => {
    expect(queryKeys.workoutDates(2026, 4)).toEqual(['workoutDates', 2026, 4])
  })

  it('workoutsForDate returns tuple with date', () => {
    const date = '2026-04-12' as DateString
    expect(queryKeys.workoutsForDate(date)).toEqual([
      'workoutsForDate',
      '2026-04-12',
    ])
  })

  it('workoutsForDate handles null', () => {
    expect(queryKeys.workoutsForDate(null)).toEqual(['workoutsForDate', null])
  })
})
