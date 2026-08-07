import { describe, it, expect } from 'vitest'
import { suggestNextSets } from './weightSuggestion'
import type { Workout, WorkoutSet } from '../schemas/workout'
import type { DateString, ISODateTimeString } from '../schemas/date'

let seq = 0

function makeWorkout(
  date: string,
  exercises: Array<{ exerciseId: string; sets: WorkoutSet[] }>,
  startedAt?: string,
): Workout {
  seq += 1
  const started = (startedAt ?? `${date}T10:00:00+09:00`) as ISODateTimeString
  return {
    id: `w-${seq}`,
    date: date as DateString,
    exercises: exercises.map((e) => ({
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseId,
      sets: e.sets,
    })),
    startedAt: started,
    endedAt: `${date}T11:00:00+09:00` as ISODateTimeString,
    createdAt: started,
    updatedAt: started,
  }
}

describe('suggestNextSets', () => {
  it('履歴がない場合は空配列を返す', () => {
    expect(suggestNextSets([], 'bench')).toEqual([])
  })

  it('対象種目を含むセッションがない場合は空配列を返す', () => {
    const workouts = [
      makeWorkout('2026-07-30', [
        { exerciseId: 'squat', sets: [{ weight: 100, reps: 5 }] },
      ]),
    ]
    expect(suggestNextSets(workouts, 'bench')).toEqual([])
  })

  it('有効セット（weight>0 かつ reps>0）が1つもない場合は空配列を返す', () => {
    const workouts = [
      makeWorkout('2026-07-30', [
        {
          exerciseId: 'bench',
          sets: [
            { weight: 0, reps: 8 },
            { weight: 60, reps: 0 },
          ],
        },
      ]),
    ]
    expect(suggestNextSets(workouts, 'bench')).toEqual([])
  })

  it('単一セッション 60kg×8 から主候補 60kg×8 と副候補 57.5kg×10 を返す', () => {
    // e1RM = 60 × (1 + 8/30) = 76
    // 主候補: 76 / (1 + 8/30) = 60 → 60kg × 8
    // 副候補: 76 / (1 + 10/30) = 57.0 → 57.5kg × 10
    const workouts = [
      makeWorkout('2026-07-30', [
        { exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] },
      ]),
    ]
    expect(suggestNextSets(workouts, 'bench')).toEqual([
      { weight: 60, reps: 8 },
      { weight: 57.5, reps: 10 },
    ])
  })

  it('直近セッションほど強く反映される（指数加重平均、減衰率 0.6）', () => {
    // 直近 80×5 (e1RM 93.33), 前回 60×5 (e1RM 70)
    // 加重平均 = (1×93.33 + 0.6×70) / 1.6 = 84.58
    // 主候補: 84.58 / (7/6) = 72.5 → 72.5kg × 5
    const workouts = [
      makeWorkout('2026-07-20', [
        { exerciseId: 'bench', sets: [{ weight: 60, reps: 5 }] },
      ]),
      makeWorkout('2026-07-30', [
        { exerciseId: 'bench', sets: [{ weight: 80, reps: 5 }] },
      ]),
    ]
    const [primary] = suggestNextSets(workouts, 'bench')
    expect(primary).toEqual({ weight: 72.5, reps: 5 })
  })

  it('入力順に依存しない（内部で日付降順に整列する）', () => {
    const older = makeWorkout('2026-07-20', [
      { exerciseId: 'bench', sets: [{ weight: 60, reps: 5 }] },
    ])
    const newer = makeWorkout('2026-07-30', [
      { exerciseId: 'bench', sets: [{ weight: 80, reps: 5 }] },
    ])
    expect(suggestNextSets([older, newer], 'bench')).toEqual(
      suggestNextSets([newer, older], 'bench'),
    )
  })

  it('同一日付は startedAt の降順で新しい方を最新とみなす', () => {
    // 目標 reps は最新セッションの1セット目 reps に従う
    const morning = makeWorkout(
      '2026-07-30',
      [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }],
      '2026-07-30T08:00:00+09:00',
    )
    const evening = makeWorkout(
      '2026-07-30',
      [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 5 }] }],
      '2026-07-30T20:00:00+09:00',
    )
    const [primary] = suggestNextSets([morning, evening], 'bench')
    expect(primary.reps).toBe(5)
  })

  it('直近 5 セッションのみを使用する（6件目以降の極端な値は無視）', () => {
    const recent5 = Array.from({ length: 5 }, (_, i) =>
      makeWorkout(`2026-07-2${5 - i}`, [
        { exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] },
      ]),
    )
    const extremeOld = makeWorkout('2026-01-01', [
      { exerciseId: 'bench', sets: [{ weight: 200, reps: 8 }] },
    ])
    expect(suggestNextSets([...recent5, extremeOld], 'bench')).toEqual(
      suggestNextSets(recent5, 'bench'),
    )
  })

  it('セッション内の e1RM はセット中の最大値を採用する', () => {
    // 60×8 (76) と 70×3 (77) → 77 を採用
    // 主候補: 77 / (1 + 8/30) = 60.79 → 60kg × 8
    const workouts = [
      makeWorkout('2026-07-30', [
        {
          exerciseId: 'bench',
          sets: [
            { weight: 60, reps: 8 },
            { weight: 70, reps: 3 },
          ],
        },
      ]),
    ]
    const [primary] = suggestNextSets(workouts, 'bench')
    expect(primary).toEqual({ weight: 60, reps: 8 })
  })

  it('主候補と副候補の丸め後重量が同じ場合は副候補を省略する', () => {
    // 2.5×8: e1RM=3.17, 主候補 2.5、副候補 2.375→2.5 で同値
    const workouts = [
      makeWorkout('2026-07-30', [
        { exerciseId: 'bench', sets: [{ weight: 2.5, reps: 8 }] },
      ]),
    ]
    expect(suggestNextSets(workouts, 'bench')).toEqual([
      { weight: 2.5, reps: 8 },
    ])
  })

  it('目標 reps は 30 に clamp される（副候補は生成されない）', () => {
    const workouts = [
      makeWorkout('2026-07-30', [
        { exerciseId: 'bench', sets: [{ weight: 20, reps: 45 }] },
      ]),
    ]
    const result = suggestNextSets(workouts, 'bench')
    expect(result).toHaveLength(1)
    expect(result[0].reps).toBe(30)
  })

  it('丸め後の重量が 0 になる場合は候補を返さない', () => {
    const workouts = [
      makeWorkout('2026-07-30', [
        { exerciseId: 'bench', sets: [{ weight: 1, reps: 1 }] },
      ]),
    ]
    expect(suggestNextSets(workouts, 'bench')).toEqual([])
  })

  it('同一セッション内に同じ種目が複数回登場してもセットを統合して扱う', () => {
    const workouts = [
      makeWorkout('2026-07-30', [
        { exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] },
        { exerciseId: 'bench', sets: [{ weight: 70, reps: 3 }] },
      ]),
    ]
    // e1RM = max(76, 77) = 77 → 主候補 60kg × 8（最初の有効セットの reps）
    const [primary] = suggestNextSets(workouts, 'bench')
    expect(primary).toEqual({ weight: 60, reps: 8 })
  })
})
