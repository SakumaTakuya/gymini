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

export type ProposedActionPayload = {
  exerciseName?: string
  exerciseId?: string
  prompt?: string
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
