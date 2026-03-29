export interface Exercise {
  id: string
  name: string
}

export interface PendingSet {
  weight: number // SetRowInput.handlePendingChange で Number() 変換済み
  reps: number
  memo: string // セット別メモ（emptyPendingSet で '' 初期化）
}

export interface WorkoutSet {
  weight: number
  reps: number
  memo: string // confirmSet_internal で pendingSet をスプレッドするため含まれる
  editing?: boolean
}

/**
 * 1種目分の記録。
 * pendingSet は入力中の未確定セット。保存済み WorkoutRecord にも含まれるが、
 * 保存時は cancelSession により draftExercises ごとクリアされる。
 */
export interface WorkoutExercise {
  exerciseId: string
  exerciseName: string
  sets: WorkoutSet[]
  pendingSet: PendingSet
}

export interface WorkoutRecord {
  id: string
  date: string // "YYYY-MM-DD" 形式
  exercises: WorkoutExercise[]
  memo: string
}

export interface WorkoutInput {
  date: string
  exercises: WorkoutExercise[]
  memo?: string
}
