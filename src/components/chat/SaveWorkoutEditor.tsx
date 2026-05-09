import { useState } from 'react'
import { AddSetButton, EditableSetRow } from './EditableSetRow'
import { ConfirmationActions } from './ConfirmationActions'

export type ExerciseEdit = {
  exerciseName: string
  sets: Array<{ weight: number; reps: number }>
}

export type SaveWorkoutEditorProps = {
  initialExercises: ExerciseEdit[]
  isSettled: boolean
  label: string
  onApprove: (exercises: ExerciseEdit[]) => void
  onReject: () => void
}

export function SaveWorkoutEditor({
  initialExercises,
  isSettled,
  label,
  onApprove,
  onReject,
}: SaveWorkoutEditorProps) {
  const [exercises, setExercises] = useState<ExerciseEdit[]>(() =>
    initialExercises.map((ex) => ({
      exerciseName: ex.exerciseName,
      sets: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
    })),
  )

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const allSetsFilled = exercises.every(
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
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex
        const sets = ex.sets.map((s, j) =>
          j === setIdx ? { ...s, [field]: value } : s,
        )
        return { ...ex, sets }
      }),
    )
  }

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) } : ex,
      ),
    )
  }

  const addSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex
        const last = ex.sets[ex.sets.length - 1] ?? { weight: 0, reps: 0 }
        return {
          ...ex,
          sets: [...ex.sets, { weight: last.weight, reps: last.reps }],
        }
      }),
    )
  }

  return (
    <>
      <div className="mb-3 flex flex-col gap-3">
        {exercises.map((ex, exIdx) => (
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
        onApprove={() => onApprove(exercises)}
        onReject={onReject}
        showFillHint={showFillHint}
      />
    </>
  )
}
