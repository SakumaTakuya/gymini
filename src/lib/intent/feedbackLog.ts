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
  /** このカードにマージされた全ての入力（text はその先頭） */
  texts: string[]
  exerciseName: string
  setsJson: string
}

const trackedRecordSchema = z.object({
  text: z.string(),
  // texts を持たない旧形式の保存データも読み戻せるようにする
  texts: z.array(z.string()).optional(),
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
      trackedRecords.set(exerciseId, {
        text: record.text,
        texts:
          record.texts && record.texts.length > 0
            ? record.texts
            : [record.text],
        exerciseName: record.exerciseName,
        setsJson: record.setsJson,
      })
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
  const existing = trackedRecords.get(record.exerciseId)
  // 同じ種目への2回目の記録は既存カードへマージされる。その場合も
  // 先の入力を失わないよう、入力は積み増して保持する（重複は除く）。
  const texts = existing
    ? existing.texts.includes(record.text)
      ? existing.texts
      : [...existing.texts, record.text]
    : [record.text]
  trackedRecords.set(record.exerciseId, {
    text: texts[0],
    texts,
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
 * 編集中でない入力中セットも、ユーザーが値を入れた（pendingSetDirty）場合は
 * セッション終了時にそのまま保存される確定値なので、末尾に足して比較する。
 */
export function resolveEffectiveSets(draft: DraftExercise): WorkoutSet[] {
  if (draft.editingSetIndex != null && draft.pendingSet !== null) {
    const i = draft.editingSetIndex
    return [
      ...draft.sets.slice(0, i),
      draft.pendingSet,
      ...draft.sets.slice(i),
    ]
  }
  if (draft.pendingSetDirty && draft.pendingSet !== null) {
    return [...draft.sets, draft.pendingSet]
  }
  return draft.sets
}

function effectiveSetsJson(draft: DraftExercise): string {
  return JSON.stringify(resolveEffectiveSets(draft))
}

let trackingSuspendCount = 0

// 進行中の編集バースト（1回の訂正）の種目 ID。編集中の数値フィールドの
// onChange ごとに同期が走るため、バースト内の途中経過では記録せず、
// バースト開始時の1回だけ record-edited を記録する。バーストは draft が
// 確定状態（編集中でも入力中でもない）に戻った時点で終わる。エントリ自体に
// 値は含まれないため、記録タイミングが最初の中間値でも最終的な
// フィードバックデータは「完了した編集ごとに1行」になる。
const pendingEditExercises = new Set<string>()

function isEditingDraft(draft: DraftExercise): boolean {
  return draft.editingSetIndex != null || draft.pendingSetDirty
}

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
      // カードにマージされた入力は全て対象なので、入力ごとに記録する
      for (const text of tracked.texts) {
        appendIntentFeedback({
          kind: 'record-removed',
          text,
          exerciseName: tracked.exerciseName,
        })
      }
      trackedRecords.delete(exerciseId)
      pendingEditExercises.delete(exerciseId)
      changed = true
      continue
    }
    const setsJson = effectiveSetsJson(draft)
    if (setsJson !== tracked.setsJson) {
      if (!pendingEditExercises.has(exerciseId)) {
        // 新しい編集バーストの開始：1回だけ記録する
        for (const text of tracked.texts) {
          appendIntentFeedback({
            kind: 'record-edited',
            text,
            exerciseName: tracked.exerciseName,
          })
        }
        pendingEditExercises.add(exerciseId)
      }
      // バースト中の途中経過では記録せず、スナップショットだけ進める
      trackedRecords.set(exerciseId, { ...tracked, setsJson })
      changed = true
    } else if (
      pendingEditExercises.has(exerciseId) &&
      !isEditingDraft(draft)
    ) {
      // バーストが確定状態で終わった（セット完了・編集の畳み込みなど）
      pendingEditExercises.delete(exerciseId)
    }
  }
  if (changed) persistTrackedRecords()
}

export function resetRoutedRecordTracking(): void {
  trackedRecords.clear()
  pendingEditExercises.clear()
  trackedRecordsLoaded = true
  safeRemoveItem(TRACKED_STORAGE_KEY)
}
