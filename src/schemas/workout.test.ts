import { describe, it, expect } from 'vitest'
import { workoutSetSchema, workoutExerciseSchema, workoutSchema } from './workout'

describe('workoutSetSchema', () => {
  it('有効なセットデータを受け付ける', () => {
    expect(workoutSetSchema.parse({ weight: 60, reps: 10 })).toEqual({
      weight: 60,
      reps: 10,
    })
  })

  it('ゼロ重量（自重）を受け付ける', () => {
    expect(workoutSetSchema.parse({ weight: 0, reps: 10 })).toEqual({
      weight: 0,
      reps: 10,
    })
  })

  it('負の重量を拒否する', () => {
    expect(() => workoutSetSchema.parse({ weight: -1, reps: 10 })).toThrow()
  })

  it('負のレップ数を拒否する', () => {
    expect(() => workoutSetSchema.parse({ weight: 60, reps: -1 })).toThrow()
  })

  it('小数のレップ数を拒否する', () => {
    expect(() => workoutSetSchema.parse({ weight: 60, reps: 10.5 })).toThrow()
  })

  it('小数の重量を受け付ける', () => {
    expect(workoutSetSchema.parse({ weight: 2.5, reps: 10 })).toEqual({
      weight: 2.5,
      reps: 10,
    })
  })
})

describe('workoutExerciseSchema', () => {
  it('有効な種目データを受け付ける', () => {
    const data = {
      exerciseId: 'bench-press',
      exerciseName: 'ベンチプレス',
      sets: [{ weight: 60, reps: 10 }],
    }
    expect(workoutExerciseSchema.parse(data)).toEqual(data)
  })

  it('空のセット配列を受け付ける', () => {
    const data = {
      exerciseId: 'bench-press',
      exerciseName: 'ベンチプレス',
      sets: [],
    }
    expect(workoutExerciseSchema.parse(data)).toEqual(data)
  })
})

describe('workoutSchema', () => {
  const validWorkout = {
    id: 'uuid-v4',
    date: '2026-03-08',
    exercises: [
      {
        exerciseId: 'bench-press',
        exerciseName: 'ベンチプレス',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 65, reps: 8 },
        ],
      },
    ],
    startedAt: '2026-03-08T10:00:00.000Z',
    endedAt: '2026-03-08T10:45:00.000Z',
    createdAt: '2026-03-08T10:45:00.000Z',
    updatedAt: '2026-03-08T10:45:00.000Z',
  }

  it('有効なワークアウトデータを受け付ける', () => {
    expect(workoutSchema.parse(validWorkout)).toEqual(validWorkout)
  })

  it('不正な日付形式を拒否する', () => {
    expect(() =>
      workoutSchema.parse({ ...validWorkout, date: '03-08-2026' }),
    ).toThrow()
  })

  it('startedAt の不正な日時形式を拒否する', () => {
    expect(() =>
      workoutSchema.parse({ ...validWorkout, startedAt: '2026-03-08' }),
    ).toThrow()
  })

  it('不正なセットデータを持つワークアウトを拒否する', () => {
    const invalid = {
      ...validWorkout,
      exercises: [
        {
          exerciseId: 'bench-press',
          exerciseName: 'ベンチプレス',
          sets: [{ weight: -1, reps: 10 }],
        },
      ],
    }
    expect(() => workoutSchema.parse(invalid)).toThrow()
  })

  it('必須フィールドの欠如を拒否する', () => {
    const { id: _, ...noId } = validWorkout
    expect(() => workoutSchema.parse(noId)).toThrow()
  })
})
