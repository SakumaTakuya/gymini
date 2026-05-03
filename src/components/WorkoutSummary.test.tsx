import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkoutSummary } from './WorkoutSummary'
import type { DateString, ISODateTimeString } from '../schemas/date'
import type { Workout } from '../schemas/workout'

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: '1',
    date: '2026-04-12' as DateString,
    exercises: [
      {
        exerciseId: 'e1',
        exerciseName: 'Bench Press',
        sets: [
          { weight: 100, reps: 10 },
          { weight: 100, reps: 8 },
        ],
      },
    ],
    startedAt: '2026-04-12T10:00:00.000Z' as ISODateTimeString,
    endedAt: '2026-04-12T11:00:00.000Z' as ISODateTimeString,
    createdAt: '2026-04-12T11:00:00.000Z' as ISODateTimeString,
    updatedAt: '2026-04-12T11:00:00.000Z' as ISODateTimeString,
    ...overrides,
  }
}

describe('WorkoutSummary', () => {
  it('日付ヘッダーを表示する', () => {
    render(
      <WorkoutSummary
        date={'2026-04-12' as DateString}
        workouts={[makeWorkout()]}
      />,
    )
    expect(screen.getByText('4月12日の記録')).toBeInTheDocument()
  })

  it('種目名を表示する', () => {
    render(
      <WorkoutSummary
        date={'2026-04-12' as DateString}
        workouts={[makeWorkout()]}
      />,
    )
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
  })

  it('重量とレップ数を含むセットを表示する', () => {
    render(
      <WorkoutSummary
        date={'2026-04-12' as DateString}
        workouts={[makeWorkout()]}
      />,
    )
    expect(screen.getByText('SET1')).toBeInTheDocument()
    expect(screen.getByText('SET2')).toBeInTheDocument()
    // Weight and reps are in separate spans
    expect(screen.getAllByText('100').length).toBe(2)
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('ワークアウト内の複数種目を分けて表示する', () => {
    const workout = makeWorkout({
      exercises: [
        {
          exerciseId: 'e1',
          exerciseName: 'Bench Press',
          sets: [{ weight: 100, reps: 10 }],
        },
        {
          exerciseId: 'e2',
          exerciseName: 'Cable Flyes',
          sets: [{ weight: 30, reps: 12 }],
        },
      ],
    })
    render(
      <WorkoutSummary
        date={'2026-04-12' as DateString}
        workouts={[workout]}
      />,
    )
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('Cable Flyes')).toBeInTheDocument()
  })

  it('複数のワークアウトをそれぞれ別のセクションで描画する', () => {
    const w1 = makeWorkout({ id: '1' })
    const w2 = makeWorkout({
      id: '2',
      exercises: [
        {
          exerciseId: 'e2',
          exerciseName: 'Squat',
          sets: [{ weight: 120, reps: 5 }],
        },
      ],
    })
    render(
      <WorkoutSummary
        date={'2026-04-12' as DateString}
        workouts={[w1, w2]}
      />,
    )
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('Squat')).toBeInTheDocument()
  })
})
