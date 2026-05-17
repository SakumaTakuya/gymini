import { nowISODateTimeString, type DateString } from '../../schemas/date'
import type {
  ChatMessage,
  PendingActionData,
  ProposedAction,
  ProposedActionKind,
  ProposedActionPayload,
} from '../../types/chat'
import type { FunctionCallRequest } from '../geminiClient'
import { isProposeTool, isWriteTool } from '../toolDefinitions'
import { parseSetsArg, type ToolExecutionResult } from '../toolExecutor'

const MAX_PROPOSAL_OPTIONS = 5
const VALID_KINDS: readonly ProposedActionKind[] = [
  'start-exercise',
  'ask-followup',
  'show-history',
]

export function partitionFunctionCalls(calls: FunctionCallRequest[]): {
  readCalls: FunctionCallRequest[]
  writeCall: FunctionCallRequest | null
  proposeCall: FunctionCallRequest | null
} {
  const readCalls: FunctionCallRequest[] = []
  let writeCall: FunctionCallRequest | null = null
  let proposeCall: FunctionCallRequest | null = null
  for (const fc of calls) {
    if (isWriteTool(fc.name)) {
      if (!writeCall) writeCall = fc
    } else if (isProposeTool(fc.name)) {
      if (!proposeCall) proposeCall = fc
    } else {
      readCalls.push(fc)
    }
  }
  return { readCalls, writeCall, proposeCall }
}

function isValidKind(value: unknown): value is ProposedActionKind {
  return (
    typeof value === 'string' &&
    (VALID_KINDS as readonly string[]).includes(value)
  )
}

function parsePayload(raw: unknown): ProposedActionPayload | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const p = raw as Record<string, unknown>
  const payload: ProposedActionPayload = {}
  if (typeof p.exerciseName === 'string') payload.exerciseName = p.exerciseName
  if (typeof p.exerciseId === 'string') payload.exerciseId = p.exerciseId
  if (typeof p.prompt === 'string') payload.prompt = p.prompt
  return Object.keys(payload).length > 0 ? payload : undefined
}

export function toProposalMessage(
  call: FunctionCallRequest,
): ChatMessage | null {
  if (call.name !== 'proposeAction') return null
  const rationale = call.args.rationale
  const rawOptions = call.args.options
  if (typeof rationale !== 'string') return null
  if (!Array.isArray(rawOptions) || rawOptions.length === 0) return null

  const actions: ProposedAction[] = []
  for (const raw of rawOptions) {
    if (actions.length >= MAX_PROPOSAL_OPTIONS) break
    if (typeof raw !== 'object' || raw === null) continue
    const r = raw as {
      id?: unknown
      label?: unknown
      kind?: unknown
      payload?: unknown
    }
    if (typeof r.id !== 'string' || r.id === '') continue
    if (typeof r.label !== 'string' || r.label === '') continue
    if (!isValidKind(r.kind)) continue
    const payload = parsePayload(r.payload)
    if (
      (r.kind === 'start-exercise' || r.kind === 'show-history') &&
      !payload?.exerciseName
    ) {
      continue
    }
    actions.push({
      id: r.id,
      label: r.label,
      kind: r.kind,
      ...(payload ? { payload } : {}),
    })
  }

  if (actions.length === 0) return null

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: rationale,
    timestamp: nowISODateTimeString(),
    actions,
  }
}

export function toPendingActionData(
  call: FunctionCallRequest,
): PendingActionData | null {
  switch (call.name) {
    case 'saveWorkout': {
      const date = call.args.date
      const exercises = call.args.exercises
      if (typeof date !== 'string' || !Array.isArray(exercises)) return null
      const exList: Array<{
        exerciseName: string
        sets: Array<{ weight: number; reps: number }>
      }> = []
      for (const e of exercises) {
        if (
          typeof e !== 'object' ||
          e === null ||
          typeof (e as { exerciseName?: unknown }).exerciseName !== 'string' ||
          !Array.isArray((e as { sets?: unknown }).sets)
        ) {
          return null
        }
        exList.push(
          e as {
            exerciseName: string
            sets: Array<{ weight: number; reps: number }>
          },
        )
      }
      return {
        actionType: 'saveWorkout',
        date: date as DateString,
        exercises: exList,
      }
    }
    case 'addExercise': {
      const name = call.args.name
      if (typeof name !== 'string') return null
      return { actionType: 'addExercise', name }
    }
    case 'addExerciseToSession': {
      const exerciseName = call.args.exerciseName
      if (typeof exerciseName !== 'string' || exerciseName.trim() === '') {
        return null
      }
      const exerciseId = call.args.exerciseId
      if (exerciseId !== undefined && typeof exerciseId !== 'string') {
        return null
      }
      const parsed = parseSetsArg(call.args.sets)
      if (!parsed.ok) return null
      return {
        actionType: 'addExerciseToSession',
        ...(typeof exerciseId === 'string' ? { exerciseId } : {}),
        exerciseName,
        ...(parsed.sets ? { sets: parsed.sets } : {}),
      }
    }
    default:
      return null
  }
}

export function buildWriteResultMessage(
  data: PendingActionData,
  result: ToolExecutionResult,
): string {
  if (!result.success) {
    if (result.error === 'DUPLICATE_EXERCISE') {
      return 'その種目は既に登録されています。'
    }
    if (result.error === 'EXERCISE_ALREADY_IN_SESSION') {
      return 'その種目は既にセッションに追加されています。'
    }
    if (result.error === 'SESSION_NOT_ACTIVE') {
      return 'ワークアウトセッションが開始されていません。セッションを開始してから追加してください。'
    }
    if (result.error === 'EXERCISE_NOT_FOUND') {
      const missing = (
        result.data as { missingExercises?: string[] } | undefined
      )?.missingExercises
      return missing && missing.length > 0
        ? `${missing.join('、')} が種目マスターに登録されていないため記録できませんでした。先に種目追加を行ってください。`
        : '種目が見つからなかったため記録できませんでした。'
    }
    return `実行に失敗しました：${result.error ?? '原因不明'}`
  }
  switch (data.actionType) {
    case 'saveWorkout':
      return 'ワークアウトを記録しました！お疲れ様でした。'
    case 'addExercise':
      return `「${data.name}」を種目マスターに追加しました。`
    case 'addExerciseToSession':
      return typeof data.exerciseId === 'string'
        ? `「${data.exerciseName}」を現在のセッションに追加しました。`
        : `「${data.exerciseName}」を種目に追加して記録を始めました！💪`
  }
}
