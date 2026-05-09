import type { DateString } from '../../schemas/date'
import type {
  PendingAction,
  PendingActionData,
} from '../../types/chat'
import type { FunctionCallRequest } from '../geminiClient'
import { isWriteTool } from '../toolDefinitions'
import { parseSetsArg, type ToolExecutionResult } from '../toolExecutor'

export function partitionFunctionCalls(calls: FunctionCallRequest[]): {
  readCalls: FunctionCallRequest[]
  writeCall: FunctionCallRequest | null
} {
  const readCalls: FunctionCallRequest[] = []
  let writeCall: FunctionCallRequest | null = null
  for (const fc of calls) {
    if (isWriteTool(fc.name)) {
      if (!writeCall) writeCall = fc
    } else {
      readCalls.push(fc)
    }
  }
  return { readCalls, writeCall }
}

export function buildPendingAction(
  call: FunctionCallRequest,
): PendingAction | null {
  const data = toPendingActionData(call)
  if (!data) return null
  return {
    id: crypto.randomUUID(),
    type: data.actionType,
    description: describePendingAction(data),
    data,
    status: 'pending',
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
      const exerciseId = call.args.exerciseId
      const exerciseName = call.args.exerciseName
      if (typeof exerciseId !== 'string' || typeof exerciseName !== 'string')
        return null
      const parsed = parseSetsArg(call.args.sets)
      if (!parsed.ok) return null
      return {
        actionType: 'addExerciseToSession',
        exerciseId,
        exerciseName,
        ...(parsed.sets ? { sets: parsed.sets } : {}),
      }
    }
    case 'addExerciseAndLog': {
      const name = call.args.name
      if (typeof name !== 'string' || name.trim() === '') return null
      const parsed = parseSetsArg(call.args.sets)
      if (!parsed.ok) return null
      const sets =
        parsed.sets && parsed.sets.length > 0
          ? parsed.sets
          : [{ weight: 0, reps: 0 }]
      return { actionType: 'addExerciseAndLog', name, sets }
    }
    default:
      return null
  }
}

function describePendingAction(data: PendingActionData): string {
  switch (data.actionType) {
    case 'saveWorkout': {
      const lines = data.exercises.map((ex) => {
        const sets = ex.sets
          .map((s) => `${s.weight}kg × ${s.reps}回`)
          .join('、')
        return `${ex.exerciseName}: ${sets}`
      })
      return `以下のワークアウトを ${data.date} に記録しますか？\n${lines.join('\n')}`
    }
    case 'addExercise':
      return `「${data.name}」を種目マスターに追加しますか？`
    case 'addExerciseToSession': {
      if (data.sets && data.sets.length > 0) {
        const setsText = data.sets
          .map((s) => `${s.weight}kg × ${s.reps}回`)
          .join('、')
        return `「${data.exerciseName}」を現在のセッションに以下の内容で追加しますか？値は調整できます\n${setsText}`
      }
      return `「${data.exerciseName}」を現在のセッションに追加しますか？`
    }
    case 'addExerciseAndLog': {
      const setsText = data.sets
        .map((s) => `${s.weight}kg × ${s.reps}回`)
        .join('、')
      return `「${data.name}」を種目マスターに追加して、記録を始めますか？値は調整できます\n${setsText}`
    }
  }
}

export function pendingActionToToolCall(action: PendingAction): {
  toolName: string
  args: Record<string, unknown>
} {
  switch (action.data.actionType) {
    case 'saveWorkout':
      return {
        toolName: 'saveWorkout',
        args: {
          date: action.data.date,
          exercises: action.data.exercises,
        },
      }
    case 'addExercise':
      return { toolName: 'addExercise', args: { name: action.data.name } }
    case 'addExerciseToSession':
      return {
        toolName: 'addExerciseToSession',
        args: {
          exerciseId: action.data.exerciseId,
          exerciseName: action.data.exerciseName,
          ...(action.data.sets ? { sets: action.data.sets } : {}),
        },
      }
    case 'addExerciseAndLog':
      return {
        toolName: 'addExerciseAndLog',
        args: {
          name: action.data.name,
          sets: action.data.sets,
        },
      }
  }
}

export function buildWriteResultMessage(
  data: PendingActionData,
  result: ToolExecutionResult,
): string {
  if (!result.success) {
    if (result.error === 'DUPLICATE_EXERCISE') {
      if (data.actionType === 'addExerciseAndLog') {
        return `「${data.name}」は既に種目マスターに登録されています。既存の種目で記録するなら「${data.name}やる」と教えてください。`
      }
      return 'その種目は既に登録されています。'
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
      return `「${data.exerciseName}」を現在のセッションに追加しました。`
    case 'addExerciseAndLog':
      return `「${data.name}」を種目に追加して記録を始めました！💪`
  }
}
