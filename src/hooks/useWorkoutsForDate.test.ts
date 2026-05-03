import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as WorkoutRepository from '../lib/workoutRepository'
import type { DateString } from '../schemas/date'

describe('useWorkoutsForDate ロジック', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('ワークアウトのない日付では空配列を返す', () => {
    const date = '2026-04-12' as DateString
    const workouts = WorkoutRepository.listByDate(date)
    expect(workouts).toEqual([])
  })

  it('記録のある日付のワークアウトを返す', () => {
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

  it('他の日付のワークアウトは返さない', () => {
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
