import type { Workout, WorkoutSet } from '../schemas/workout'

// 重量提案は LLM を使わず、過去記録からの決定的ロジックで行う
// （docs/adr/workout.md「重量提案は決定的ロジック（推定1RM）で行い、LLM を使わない」）。
//
// 1. 対象種目を含む直近 MAX_SESSIONS セッションを抽出
// 2. セッションごとに Epley 式 e1RM = weight × (1 + reps/30) の最大値を計算
// 3. 新しいセッションほど重い指数加重平均（減衰率 DECAY）
// 4. 目標 reps（最新セッションの1セット目）から逆算し、プレート刻みに丸める

const MAX_SESSIONS = 5
const DECAY = 0.6
const PLATE_STEP_KG = 2.5
const EPLEY_DIVISOR = 30
const MAX_TARGET_REPS = 30
const ALT_REPS_DELTA = 2

function isValidSet(set: WorkoutSet): boolean {
  return set.weight > 0 && set.reps > 0
}

function epley1RM(set: WorkoutSet): number {
  return set.weight * (1 + set.reps / EPLEY_DIVISOR)
}

function weightForReps(e1rm: number, reps: number): number {
  return Math.round(e1rm / (1 + reps / EPLEY_DIVISOR) / PLATE_STEP_KG) * PLATE_STEP_KG
}

/**
 * 過去のワークアウト履歴から、次の1セット目の候補（重量 × 回数）を返す。
 * 主候補（最新セッションと同じ目標 reps）と、あれば副候補（+2 reps × 軽め）の
 * 最大 2 件。履歴がない・算出不能な場合は空配列。
 */
export function suggestNextSets(
  workouts: Workout[],
  exerciseId: string,
): WorkoutSet[] {
  // 日付降順（同日なら startedAt 降順）に整列し、種目ごとの有効セットへ写像
  const sessions = [...workouts]
    .sort((a, b) => {
      if (a.date !== b.date) return a.date > b.date ? -1 : 1
      return a.startedAt > b.startedAt ? -1 : 1
    })
    .map((w) =>
      w.exercises
        .filter((e) => e.exerciseId === exerciseId)
        .flatMap((e) => e.sets)
        .filter(isValidSet),
    )
    .filter((sets) => sets.length > 0)
    .slice(0, MAX_SESSIONS)

  if (sessions.length === 0) return []

  let numerator = 0
  let denominator = 0
  sessions.forEach((sets, i) => {
    const decayWeight = Math.pow(DECAY, i)
    numerator += decayWeight * Math.max(...sets.map(epley1RM))
    denominator += decayWeight
  })
  const e1rm = numerator / denominator

  const targetReps = Math.min(sessions[0][0].reps, MAX_TARGET_REPS)
  const primaryWeight = weightForReps(e1rm, targetReps)
  if (primaryWeight <= 0) return []

  const result: WorkoutSet[] = [{ weight: primaryWeight, reps: targetReps }]

  const altReps = targetReps + ALT_REPS_DELTA
  if (altReps <= MAX_TARGET_REPS) {
    const altWeight = weightForReps(e1rm, altReps)
    if (altWeight > 0 && altWeight !== primaryWeight) {
      result.push({ weight: altWeight, reps: altReps })
    }
  }

  return result
}
