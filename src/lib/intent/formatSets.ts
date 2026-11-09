import type { WorkoutSet } from '../../schemas/workout'

function formatOneSet(set: WorkoutSet): string {
  return set.weight > 0 ? `${set.weight}kg×${set.reps}回` : `自重 ${set.reps}回`
}

/** セット列の要約表示。全セット同一なら「60kg×10回 ×3セット」に畳む。 */
export function formatSetsSummary(sets: WorkoutSet[]): string {
  if (sets.length === 0) return ''
  const first = sets[0]
  const allSame = sets.every(
    (s) => s.weight === first.weight && s.reps === first.reps,
  )
  if (allSame && sets.length > 1) {
    return `${formatOneSet(first)} ×${sets.length}セット`
  }
  return sets.map(formatOneSet).join('、')
}
