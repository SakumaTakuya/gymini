import type { DraftExercise } from '../../schemas/workout'

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
  }
}
