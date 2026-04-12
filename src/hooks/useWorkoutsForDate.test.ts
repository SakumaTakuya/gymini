import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as WorkoutRepository from '../lib/workoutRepository'
import type { DateString } from '../schemas/date'

describe('useWorkoutsForDate logic', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('returns empty array for date with no workouts', () => {
    const date = '2026-04-12' as DateString
    const workouts = WorkoutRepository.listByDate(date)
    expect(workouts).toEqual([])
  })

  it('returns workouts for date with records', () => {
    const date = '2026-04-12' as DateString
    WorkoutRepository.save({
      date,
      exercises: [
        {
          exerciseId: 'e1',
          exerciseName: 'Bench Press',
          sets: [{ weight: 100, reps: 10 }],
        },
      ],
      startedAt: '2026-04-12T10:00:00.000Z' as never,
      endedAt: '2026-04-12T11:00:00.000Z' as never,
    })
    const workouts = WorkoutRepository.listByDate(date)
    expect(workouts).toHaveLength(1)
    expect(workouts[0].exercises[0].exerciseName).toBe('Bench Press')
  })

  it('does not return workouts from other dates', () => {
    WorkoutRepository.save({
      date: '2026-04-11' as DateString,
      exercises: [
        {
          exerciseId: 'e1',
          exerciseName: 'Squat',
          sets: [{ weight: 120, reps: 5 }],
        },
      ],
      startedAt: '2026-04-11T10:00:00.000Z' as never,
      endedAt: '2026-04-11T11:00:00.000Z' as never,
    })

    const workouts = WorkoutRepository.listByDate('2026-04-12' as DateString)
    expect(workouts).toEqual([])
  })
})
