import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import type { DraftExercise } from '../schemas/workout'

const RECENT_SETS_LIMIT = 3

function formatExerciseLine(draft: DraftExercise): string {
  const parts: string[] = [`- ${draft.exerciseName}`]
  if (draft.sets.length === 0) {
    parts.push('（未入力）')
  } else {
    const recent = draft.sets.slice(-RECENT_SETS_LIMIT)
    const prefix = draft.sets.length > RECENT_SETS_LIMIT ? '直近: ' : ''
    const setsText = recent.map((s) => `${s.weight}kg × ${s.reps}回`).join(' / ')
    parts.push(`: ${prefix}${setsText}（計 ${draft.sets.length} セット）`)
  }
  if (draft.pendingSetDirty && draft.pendingSet !== null) {
    const next = draft.sets.length + 1
    const w = draft.pendingSet.weight
    const r = draft.pendingSet.reps
    parts.push(
      ` [現在 ${next} セット目入力中: ${w}kg × ${r > 0 ? `${r}回` : '?回'}]`,
    )
  }
  return parts.join('')
}

export function buildActiveSessionContext(): string | null {
  const state = useWorkoutSessionStore.getState()
  if (!state.isActive) return null

  const lines: string[] = []
  if (state.startedAt) {
    lines.push(`- 開始時刻: ${state.startedAt}`)
  }
  if (state.draftExercises.length === 0) {
    lines.push('- まだ種目は追加されていません')
  } else {
    for (const draft of state.draftExercises) {
      lines.push(formatExerciseLine(draft))
    }
  }
  return lines.join('\n')
}
