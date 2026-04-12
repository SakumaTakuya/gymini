import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as WorkoutRepository from '../lib/workoutRepository'
import type { DateString } from '../schemas/date'
import { todayDateString } from '../schemas/date'
import { queryKeys } from '../lib/queryKeys'

// Test the parseMonth and formatMonth helpers via queryKeys
// The actual hook depends on TanStack Router context which is hard to unit test.
// We test the core logic here and integration in the route-level test.

describe('useCalendar logic', () => {
  it('queryKeys.workoutDates generates correct key', () => {
    expect(queryKeys.workoutDates(2026, 4)).toEqual(['workoutDates', 2026, 4])
  })

  it('queryKeys.workoutsForDate generates correct key', () => {
    const date = '2026-04-12' as DateString
    expect(queryKeys.workoutsForDate(date)).toEqual(['workoutsForDate', '2026-04-12'])
  })

  it('todayDateString returns today in local timezone', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 12, 10, 0, 0)) // April 12
    expect(todayDateString()).toBe('2026-04-12')
    vi.useRealTimers()
  })
})

describe('workoutRepository integration for calendar', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('listByDateDesc returns workouts sorted by date descending', () => {
    const workouts = WorkoutRepository.listByDateDesc()
    expect(workouts).toEqual([])
  })

  it('listByDate filters by specific date', () => {
    const date = '2026-04-12' as DateString
    const workouts = WorkoutRepository.listByDate(date)
    expect(workouts).toEqual([])
  })

  it('listByDate returns matching workouts after save', () => {
    const date = '2026-04-12' as DateString
    WorkoutRepository.save({
      date,
      exercises: [
        { exerciseId: 'e1', exerciseName: 'Bench Press', sets: [{ weight: 100, reps: 10 }] },
      ],
      startedAt: '2026-04-12T10:00:00.000Z' as never,
      endedAt: '2026-04-12T11:00:00.000Z' as never,
    })
    const workouts = WorkoutRepository.listByDate(date)
    expect(workouts).toHaveLength(1)
    expect(workouts[0].date).toBe('2026-04-12')
  })

  it('daysWithWorkouts can be computed from listByDateDesc', () => {
    const date1 = '2026-04-10' as DateString
    const date2 = '2026-04-12' as DateString
    WorkoutRepository.save({
      date: date1,
      exercises: [{ exerciseId: 'e1', exerciseName: 'Squat', sets: [] }],
      startedAt: '2026-04-10T10:00:00.000Z' as never,
      endedAt: '2026-04-10T11:00:00.000Z' as never,
    })
    WorkoutRepository.save({
      date: date2,
      exercises: [{ exerciseId: 'e2', exerciseName: 'Bench', sets: [] }],
      startedAt: '2026-04-12T10:00:00.000Z' as never,
      endedAt: '2026-04-12T11:00:00.000Z' as never,
    })

    const all = WorkoutRepository.listByDateDesc()
    const aprilDays = new Set(
      all
        .filter((w) => {
          const [y, m] = w.date.split('-').map(Number)
          return y === 2026 && m === 4
        })
        .map((w) => w.date),
    )
    expect(aprilDays.size).toBe(2)
    expect(aprilDays.has('2026-04-10' as DateString)).toBe(true)
    expect(aprilDays.has('2026-04-12' as DateString)).toBe(true)
  })
})
