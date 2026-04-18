import type { DateString, ISODateTimeString } from '../schemas/date'

export type PendingActionStatus = 'pending' | 'approved' | 'rejected'

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
  exerciseId: string
  exerciseName: string
}

export type PendingActionData =
  | SaveWorkoutData
  | AddExerciseData
  | AddExerciseToSessionData

export type PendingAction = {
  id: string
  type: 'saveWorkout' | 'addExercise' | 'addExerciseToSession'
  description: string
  data: PendingActionData
  status: PendingActionStatus
}

export type ToolCallResult = {
  toolName: string
  args: Record<string, unknown>
  result: unknown
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: ISODateTimeString
  toolCalls?: ToolCallResult[]
  pendingAction?: PendingAction
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
