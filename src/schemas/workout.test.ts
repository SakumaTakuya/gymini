import { describe, it, expect } from 'vitest'
import { workoutSetSchema, workoutExerciseSchema, workoutSchema } from './workout'

describe('workoutSetSchema', () => {
  it('accepts valid set data', () => {
    expect(workoutSetSchema.parse({ weight: 60, reps: 10 })).toEqual({
      weight: 60,
      reps: 10,
    })
  })

  it('accepts zero weight (bodyweight)', () => {
    expect(workoutSetSchema.parse({ weight: 0, reps: 10 })).toEqual({
      weight: 0,
      reps: 10,
    })
  })

  it('rejects negative weight', () => {
    expect(() => workoutSetSchema.parse({ weight: -1, reps: 10 })).toThrow()
  })

  it('rejects negative reps', () => {
    expect(() => workoutSetSchema.parse({ weight: 60, reps: -1 })).toThrow()
  })

  it('rejects decimal reps', () => {
    expect(() => workoutSetSchema.parse({ weight: 60, reps: 10.5 })).toThrow()
  })

  it('accepts decimal weight', () => {
    expect(workoutSetSchema.parse({ weight: 2.5, reps: 10 })).toEqual({
      weight: 2.5,
      reps: 10,
    })
  })
})

describe('workoutExerciseSchema', () => {
  it('accepts valid exercise data', () => {
    const data = {
      exerciseId: 'bench-press',
      exerciseName: 'ベンチプレス',
      sets: [{ weight: 60, reps: 10 }],
    }
    expect(workoutExerciseSchema.parse(data)).toEqual(data)
  })

  it('accepts empty sets array', () => {
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

  it('accepts valid workout data', () => {
    expect(workoutSchema.parse(validWorkout)).toEqual(validWorkout)
  })

  it('rejects invalid date format', () => {
    expect(() =>
      workoutSchema.parse({ ...validWorkout, date: '03-08-2026' }),
    ).toThrow()
  })

  it('rejects invalid datetime format for startedAt', () => {
    expect(() =>
      workoutSchema.parse({ ...validWorkout, startedAt: '2026-03-08' }),
    ).toThrow()
  })

  it('rejects workout with invalid set data', () => {
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

  it('rejects missing required fields', () => {
    const { id: _, ...noId } = validWorkout
    expect(() => workoutSchema.parse(noId)).toThrow()
  })
})
