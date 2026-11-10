import type { DraftExercise } from '../../schemas/workout'
import { findMentionedExerciseName } from './exerciseMention'

// edit 意図の対象特定（intent-router FR_005）。
// draft 内の種目を特定して通常カードへ誘導するまでとし、
// プログラム経由で draft を書き換える経路は作らない。

const RECENCY_HINTS = ['最後', 'さっき', '今の']

export function findEditTargetExercise(
  text: string,
  draftExercises: DraftExercise[],
): DraftExercise | null {
  if (draftExercises.length === 0) return null

  const mentioned = findMentionedExerciseName(
    text,
    draftExercises.map((d) => d.exerciseName),
  )
  if (mentioned) {
    return draftExercises.find((d) => d.exerciseName === mentioned) ?? null
  }

  if (RECENCY_HINTS.some((hint) => text.includes(hint))) {
    return draftExercises[draftExercises.length - 1]
  }
  return null
}

export function buildEditGuidanceMessage(exerciseName: string): string {
  return `「${exerciseName}」の記録は、タイムラインにある通常カードで修正できます。カードを開いてセットを編集してください。`
}
