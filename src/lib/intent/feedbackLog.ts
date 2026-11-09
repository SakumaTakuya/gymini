import { z } from 'zod'
import { nowISODateTimeString, type ISODateTimeString } from '../../schemas/date'
import type { DraftExercise, WorkoutSet } from '../../schemas/workout'
import { safeGetItem, safeRemoveItem, safeSetItem } from '../storage'
import { INTENT_LABELS, type IntentLabel, type IntentScores } from './intentClassifier'

// 端末内フィードバックログ（intent-router FR_007）。
// 分類結果・候補チップでの選択・ルーティング後に取り消し/修正された記録を
// localStorage にのみ保存する。外部へは送信しない（B-001）。

const STORAGE_KEY = 'gymini:intent-feedback'
const MAX_ENTRIES = 200

export type IntentFeedbackKind =
  | 'classified'
  | 'chip-choice'
  | 'record-removed'
  | 'record-edited'

export interface IntentFeedbackEntry {
  id: string
  timestamp: ISODateTimeString
  kind: IntentFeedbackKind
  /** 分類・選択の対象になったユーザー入力 */
  text: string
  scores?: IntentScores
  decided?: IntentLabel[]
  candidates?: IntentLabel[]
  chosenIntent?: IntentLabel
  exerciseName?: string
}

const scoresSchema = z.object({
  record: z.number(),
  history: z.number(),
  advice: z.number(),
  edit: z.number(),
  other: z.number(),
})

const entrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  kind: z.enum(['classified', 'chip-choice', 'record-removed', 'record-edited']),
  text: z.string(),
  scores: scoresSchema.optional(),
  decided: z.array(z.enum(INTENT_LABELS)).optional(),
  candidates: z.array(z.enum(INTENT_LABELS)).optional(),
  chosenIntent: z.enum(INTENT_LABELS).optional(),
  exerciseName: z.string().optional(),
})

export function readIntentFeedback(): IntentFeedbackEntry[] {
  const raw = safeGetItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const result = z.array(entrySchema).safeParse(JSON.parse(raw))
    return result.success ? (result.data as IntentFeedbackEntry[]) : []
  } catch {
    return []
  }
}

export function appendIntentFeedback(
  entry: Omit<IntentFeedbackEntry, 'id' | 'timestamp'>,
): void {
  const entries = readIntentFeedback()
  entries.push({
    ...entry,
    id: crypto.randomUUID(),
    timestamp: nowISODateTimeString(),
  })
  const trimmed =
    entries.length > MAX_ENTRIES ? entries.slice(-MAX_ENTRIES) : entries
  safeSetItem(STORAGE_KEY, JSON.stringify(trimmed))
}

export function clearIntentFeedback(): void {
  safeSetItem(STORAGE_KEY, JSON.stringify([]))
}

// --- ルーティングで挿入した記録の追跡（取り消し・修正の検出） ---
// draft はリロード後も永続化されて残るため、追跡状態も localStorage に
// 永続化しないと、リロード後の編集・削除を検出できなくなる。
// 保存先は端末内のみ（B-001）。

const TRACKED_STORAGE_KEY = 'gymini:intent-feedback-tracked'

interface TrackedRecord {
  text: string
  exerciseName: string
  setsJson: string
}

const trackedRecordSchema = z.object({
  text: z.string(),
  exerciseName: z.string(),
  setsJson: z.string(),
})

const trackedRecordsSchema = z.record(z.string(), trackedRecordSchema)

const trackedRecords = new Map<string, TrackedRecord>()
let trackedRecordsLoaded = false

function ensureTrackedRecordsLoaded(): void {
  if (trackedRecordsLoaded) return
  trackedRecordsLoaded = true
  const raw = safeGetItem(TRACKED_STORAGE_KEY)
  if (!raw) return
  try {
    const result = trackedRecordsSchema.safeParse(JSON.parse(raw))
    if (!result.success) return
    for (const [exerciseId, record] of Object.entries(result.data)) {
      trackedRecords.set(exerciseId, record)
    }
  } catch {
    // 壊れた保存データは追跡なしとして扱う
  }
}

function persistTrackedRecords(): void {
  safeSetItem(
    TRACKED_STORAGE_KEY,
    JSON.stringify(Object.fromEntries(trackedRecords)),
  )
}

export function trackRoutedRecord(record: {
  text: string
  exerciseId: string
  exerciseName: string
  sets: WorkoutSet[]
}): void {
  ensureTrackedRecordsLoaded()
  trackedRecords.set(record.exerciseId, {
    text: record.text,
    exerciseName: record.exerciseName,
    setsJson: JSON.stringify(record.sets),
  })
  persistTrackedRecords()
}

/**
 * 編集バッファを戻した「実効セット列」。セット編集中は対象セットが
 * draft.sets から pendingSet へ一時的に移るため、そのまま比較すると
 * 編集を開いただけで「修正」と誤記録してしまう。編集中のセットは
 * 元の位置に戻して比較する（workoutSessionStore の restoreEditingSet と同じ規則）。
 */
function effectiveSetsJson(draft: DraftExercise): string {
  if (draft.editingSetIndex != null && draft.pendingSet !== null) {
    const i = draft.editingSetIndex
    const restored = [
      ...draft.sets.slice(0, i),
      draft.pendingSet,
      ...draft.sets.slice(i),
    ]
    return JSON.stringify(restored)
  }
  return JSON.stringify(draft.sets)
}

let trackingSuspendCount = 0

/**
 * 追跡の突き合わせを一時的に止める。ルーティング側のマージなど、
 * 複数回のストア更新を伴う処理の途中状態を「ユーザーの修正」と
 * 誤記録しないために使う。戻り値の関数で再開する。
 */
export function suspendRoutedRecordTracking(): () => void {
  trackingSuspendCount += 1
  let resumed = false
  return () => {
    if (resumed) return
    resumed = true
    trackingSuspendCount = Math.max(0, trackingSuspendCount - 1)
  }
}

/**
 * 現在の draft と追跡中の記録を突き合わせ、削除されたものを
 * record-removed、セットが変わったものを record-edited として記録する。
 * セッションの draft が変わるたびに呼び出す想定。
 * セッションが非アクティブな状態での draft クリアは終了時の保存に伴う
 * ものなので「取り消し」とはみなさず、追跡だけを解除する。
 */
export function syncRoutedRecordTracking(
  draftExercises: DraftExercise[],
  sessionActive: boolean,
): void {
  if (trackingSuspendCount > 0) return
  ensureTrackedRecordsLoaded()
  if (!sessionActive) {
    resetRoutedRecordTracking()
    return
  }
  let changed = false
  for (const [exerciseId, tracked] of [...trackedRecords]) {
    const draft = draftExercises.find((d) => d.exerciseId === exerciseId)
    if (!draft) {
      appendIntentFeedback({
        kind: 'record-removed',
        text: tracked.text,
        exerciseName: tracked.exerciseName,
      })
      trackedRecords.delete(exerciseId)
      changed = true
      continue
    }
    const setsJson = effectiveSetsJson(draft)
    if (setsJson !== tracked.setsJson) {
      appendIntentFeedback({
        kind: 'record-edited',
        text: tracked.text,
        exerciseName: tracked.exerciseName,
      })
      trackedRecords.set(exerciseId, { ...tracked, setsJson })
      changed = true
    }
  }
  if (changed) persistTrackedRecords()
}

export function resetRoutedRecordTracking(): void {
  trackedRecords.clear()
  trackedRecordsLoaded = true
  safeRemoveItem(TRACKED_STORAGE_KEY)
}
