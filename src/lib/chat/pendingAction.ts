import type { DateString } from '../../schemas/date'
import type { PendingActionData } from '../../types/chat'
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
