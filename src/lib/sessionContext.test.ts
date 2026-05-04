import { beforeEach, describe, expect, test } from 'vitest'
import { buildActiveSessionContext } from './sessionContext'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import type { DateString, ISODateTimeString } from '../schemas/date'
import type { DraftExercise } from '../schemas/workout'

function makeDraft(overrides: Partial<DraftExercise> = {}): DraftExercise {
  return {
    exerciseId: overrides.exerciseId ?? 'ex-1',
    exerciseName: overrides.exerciseName ?? 'ベンチプレス',
    sets: overrides.sets ?? [],
    pendingSet: overrides.pendingSet ?? null,
    pendingSetDirty: overrides.pendingSetDirty ?? false,
    cardState: overrides.cardState ?? 'idle',
    editingSetIndex: overrides.editingSetIndex ?? null,
  }
}

describe('buildActiveSessionContext', () => {
  beforeEach(() => {
    useWorkoutSessionStore.setState({
      isActive: false,
      startedAt: null,
      date: null,
      draftExercises: [],
    })
  })

  test('セッションが非アクティブのとき null を返す', () => {
    expect(buildActiveSessionContext()).toBeNull()
  })

  test('アクティブセッションでセット情報を含む文字列を返す', () => {
    useWorkoutSessionStore.setState({
      isActive: true,
      startedAt: '2026-05-04T19:32:00+09:00' as ISODateTimeString,
      date: '2026-05-04' as DateString,
      draftExercises: [
        makeDraft({
          exerciseName: 'ベンチプレス',
          sets: [
            { weight: 60, reps: 10 },
            { weight: 60, reps: 10 },
          ],
        }),
      ],
    })

    const result = buildActiveSessionContext()
    expect(result).not.toBeNull()
    expect(result).toContain('ベンチプレス')
    expect(result).toContain('60kg × 10回')
  })

  test('直近 3 セットのみ含む（4 セット以上ある場合は最新 3 セット）', () => {
    useWorkoutSessionStore.setState({
      isActive: true,
      startedAt: '2026-05-04T19:00:00+09:00' as ISODateTimeString,
      date: '2026-05-04' as DateString,
      draftExercises: [
        makeDraft({
          exerciseName: 'スクワット',
          sets: [
            { weight: 80, reps: 10 },
            { weight: 90, reps: 8 },
            { weight: 100, reps: 5 },
            { weight: 110, reps: 3 },
            { weight: 115, reps: 2 },
          ],
        }),
      ],
    })

    const result = buildActiveSessionContext()
    expect(result).not.toBeNull()
    // 最新 3 セットだけ含まれる
    expect(result).toContain('100kg × 5回')
    expect(result).toContain('110kg × 3回')
    expect(result).toContain('115kg × 2回')
    // 古い 2 セットは含まれない
    expect(result).not.toContain('80kg × 10回')
    expect(result).not.toContain('90kg × 8回')
  })

  test('pendingSet が dirty な場合、現在入力中である旨を含む', () => {
    useWorkoutSessionStore.setState({
      isActive: true,
      startedAt: '2026-05-04T19:00:00+09:00' as ISODateTimeString,
      date: '2026-05-04' as DateString,
      draftExercises: [
        makeDraft({
          exerciseName: 'デッドリフト',
          sets: [{ weight: 100, reps: 5 }],
          pendingSet: { weight: 110, reps: 0 },
          pendingSetDirty: true,
          cardState: 'recording',
        }),
      ],
    })

    const result = buildActiveSessionContext()
    expect(result).not.toBeNull()
    expect(result).toMatch(/入力中/)
    expect(result).toContain('110kg')
  })

  test('未入力の種目（sets が空）も種目名は含む', () => {
    useWorkoutSessionStore.setState({
      isActive: true,
      startedAt: '2026-05-04T19:00:00+09:00' as ISODateTimeString,
      date: '2026-05-04' as DateString,
      draftExercises: [
        makeDraft({
          exerciseName: 'ラットプルダウン',
          sets: [],
        }),
      ],
    })

    const result = buildActiveSessionContext()
    expect(result).not.toBeNull()
    expect(result).toContain('ラットプルダウン')
  })

  test('複数種目を含む', () => {
    useWorkoutSessionStore.setState({
      isActive: true,
      startedAt: '2026-05-04T19:00:00+09:00' as ISODateTimeString,
      date: '2026-05-04' as DateString,
      draftExercises: [
        makeDraft({
          exerciseId: 'ex-1',
          exerciseName: 'ベンチプレス',
          sets: [{ weight: 60, reps: 10 }],
        }),
        makeDraft({
          exerciseId: 'ex-2',
          exerciseName: 'スクワット',
          sets: [{ weight: 100, reps: 5 }],
        }),
      ],
    })

    const result = buildActiveSessionContext()
    expect(result).not.toBeNull()
    expect(result).toContain('ベンチプレス')
    expect(result).toContain('スクワット')
  })
})
