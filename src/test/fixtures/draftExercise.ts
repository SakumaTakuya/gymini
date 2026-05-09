import type { ISODateTimeString } from '../../schemas/date'
import type { DraftExercise } from '../../schemas/workout'

const DEFAULT_TIMESTAMP =
  '2026-04-18T12:00:00+09:00' as ISODateTimeString

export function makeDraftExercise(
  overrides: Partial<DraftExercise> = {},
): DraftExercise {
  return {
    exerciseId: overrides.exerciseId ?? 'ex-1',
    exerciseName: overrides.exerciseName ?? 'ベンチプレス',
    sets: overrides.sets ?? [],
    pendingSet: overrides.pendingSet ?? null,
    pendingSetDirty: overrides.pendingSetDirty ?? false,
    cardState: overrides.cardState ?? 'idle',
    editingSetIndex: overrides.editingSetIndex ?? null,
    origin: overrides.origin ?? 'manual',
    timestamp: overrides.timestamp ?? DEFAULT_TIMESTAMP,
  }
}
