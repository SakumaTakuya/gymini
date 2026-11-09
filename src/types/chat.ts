import type { DateString, ISODateTimeString } from '../schemas/date'

export type SaveWorkoutData = {
  actionType: 'saveWorkout'
  exercises: Array<{
    exerciseName: string
    sets: Array<{ weight: number; reps: number }>
  }>
  date: DateString
}

export type AddExerciseData = {
  actionType: 'addExercise'
  name: string
}

export type AddExerciseToSessionData = {
  actionType: 'addExerciseToSession'
  exerciseId?: string
  exerciseName: string
  sets?: Array<{ weight: number; reps: number }>
}

export type PendingActionData =
  | SaveWorkoutData
  | AddExerciseData
  | AddExerciseToSessionData

export type ToolCallResult = {
  toolName: string
  args: Record<string, unknown>
  result: unknown
}

export type ProposedActionKind =
  | 'start-exercise'
  | 'ask-followup'
  | 'show-history'
  // ローカル分類の候補チップ（intent-router FR_002）。タップで元の入力を
  // 選んだ意図として再ルーティングする。
  | 'intent-route'
  // edit の対象特定チップ（intent-router FR_005）。タップで対象カードへ誘導する。
  | 'edit-target'

export type ProposedActionPayload = {
  exerciseName?: string
  exerciseId?: string
  prompt?: string
  /** intent-route: ユーザーが選んだ意図ラベル（IntentLabel の文字列表現） */
  intent?: string
  /** intent-route: 分類対象だった元の入力テキスト */
  text?: string
}

export type ProposedAction = {
  id: string
  label: string
  kind: ProposedActionKind
  payload?: ProposedActionPayload
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: ISODateTimeString
  toolCalls?: ToolCallResult[]
  actions?: ProposedAction[]
  consumedActionId?: string | null
}

export type SummaryPeriod = {
  type: 'week' | 'month'
  startDate: DateString
  endDate: DateString
}

export type ExerciseBreakdown = {
  exerciseName: string
  sessionCount: number
  totalSets: number
  maxWeight: number
  totalReps: number
}

export type WorkoutSummary = {
  period: SummaryPeriod
  totalSessions: number
  totalSets: number
  exerciseBreakdown: ExerciseBreakdown[]
}
