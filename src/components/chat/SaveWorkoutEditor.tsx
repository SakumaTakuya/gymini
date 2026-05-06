import { useState } from 'react'
import type { PendingAction, SaveWorkoutData } from '../../types/chat'
import { AddSetButton, EditableSetRow } from './EditableSetRow'
import { ConfirmationActions } from './ConfirmationActions'

type FormState = {
  exercises: Array<{
    exerciseName: string
    sets: Array<{ weight: number; reps: number }>
  }>
}

export type SaveWorkoutEditorProps = {
  pendingAction: PendingAction & { data: SaveWorkoutData }
  isSettled: boolean
  label: string
  onApprove: (editedData: SaveWorkoutData) => void
  onReject: () => void
}

export function SaveWorkoutEditor({
  pendingAction,
  isSettled,
  label,
  onApprove,
  onReject,
}: SaveWorkoutEditorProps) {
  const [state, setState] = useState<FormState>(() => ({
    exercises: pendingAction.data.exercises.map((ex) => ({
      exerciseName: ex.exerciseName,
      sets: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
    })),
  }))

  const totalSets = state.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const allSetsFilled = state.exercises.every(
    (ex) =>
      ex.sets.length > 0 && ex.sets.every((s) => s.weight > 0 && s.reps > 0),
  )
  const canApprove = !isSettled && totalSets > 0 && allSetsFilled
  const showFillHint = !isSettled && totalSets > 0 && !allSetsFilled

  const updateSet = (
    exIdx: number,
    setIdx: number,
    field: 'weight' | 'reps',
    value: number,
  ) => {
    setState((prev) => ({
      exercises: prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex
        const sets = ex.sets.map((s, j) =>
          j === setIdx ? { ...s, [field]: value } : s,
        )
        return { ...ex, sets }
      }),
    }))
  }

  const removeSet = (exIdx: number, setIdx: number) => {
    setState((prev) => ({
      exercises: prev.exercises.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) } : ex,
      ),
    }))
  }

  const addSet = (exIdx: number) => {
    setState((prev) => ({
      exercises: prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex
        const last = ex.sets[ex.sets.length - 1] ?? { weight: 0, reps: 0 }
        return {
          ...ex,
          sets: [...ex.sets, { weight: last.weight, reps: last.reps }],
        }
      }),
    }))
  }

  const handleApprove = () => {
    onApprove({
      actionType: 'saveWorkout',
      date: pendingAction.data.date,
      exercises: state.exercises.map((ex) => ({
        exerciseName: ex.exerciseName,
        sets: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
      })),
    })
  }

  return (
    <>
      <div className="mb-3 flex flex-col gap-3">
        {state.exercises.map((ex, exIdx) => (
          <div key={`${ex.exerciseName}-${exIdx}`} className="flex flex-col gap-2">
            <div className="font-semibold text-gym-black">{ex.exerciseName}</div>
            <div className="flex flex-col gap-2">
              {ex.sets.map((s, setIdx) => (
                <EditableSetRow
                  key={setIdx}
                  setNumber={setIdx + 1}
                  weight={s.weight}
                  reps={s.reps}
                  isSettled={isSettled}
                  onWeightChange={(v) => updateSet(exIdx, setIdx, 'weight', v)}
                  onRepsChange={(v) => updateSet(exIdx, setIdx, 'reps', v)}
                  onRemove={() => removeSet(exIdx, setIdx)}
                />
              ))}
            </div>
            <AddSetButton isSettled={isSettled} onClick={() => addSet(exIdx)} />
          </div>
        ))}
      </div>
      <ConfirmationActions
        label={label}
        canApprove={canApprove}
        isSettled={isSettled}
        onApprove={handleApprove}
        onReject={onReject}
        showFillHint={showFillHint}
      />
    </>
  )
}
