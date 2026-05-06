import { useState } from 'react'
import type {
  AddExerciseAndLogData,
  AddExerciseToSessionData,
  PendingAction,
  PendingActionData,
} from '../../types/chat'
import { AddSetButton, EditableSetRow } from './EditableSetRow'
import { ConfirmationActions } from './ConfirmationActions'

type FormState = {
  sets: Array<{ weight: number; reps: number }>
}

type EditableData =
  | (AddExerciseToSessionData & {
      sets: Array<{ weight: number; reps: number }>
    })
  | AddExerciseAndLogData

export type SingleExerciseEditorProps = {
  pendingAction: PendingAction & { data: EditableData }
  isSettled: boolean
  label: string
  onApprove: (editedData: PendingActionData) => void
  onReject: () => void
}

export function SingleExerciseEditor({
  pendingAction,
  isSettled,
  label,
  onApprove,
  onReject,
}: SingleExerciseEditorProps) {
  const [state, setState] = useState<FormState>(() => ({
    sets: pendingAction.data.sets.map((s) => ({
      weight: s.weight,
      reps: s.reps,
    })),
  }))

  const exerciseLabel =
    pendingAction.data.actionType === 'addExerciseToSession'
      ? pendingAction.data.exerciseName
      : pendingAction.data.name

  const allSetsFilled = state.sets.every((s) => s.weight > 0 && s.reps > 0)
  const canApprove = !isSettled && state.sets.length > 0 && allSetsFilled
  const showFillHint = !isSettled && state.sets.length > 0 && !allSetsFilled

  const updateSet = (
    setIdx: number,
    field: 'weight' | 'reps',
    value: number,
  ) => {
    setState((prev) => ({
      sets: prev.sets.map((s, i) =>
        i === setIdx ? { ...s, [field]: value } : s,
      ),
    }))
  }

  const removeSet = (setIdx: number) => {
    setState((prev) => ({
      sets: prev.sets.filter((_, i) => i !== setIdx),
    }))
  }

  const addSet = () => {
    setState((prev) => {
      const last = prev.sets[prev.sets.length - 1] ?? { weight: 0, reps: 0 }
      return {
        sets: [...prev.sets, { weight: last.weight, reps: last.reps }],
      }
    })
  }

  const handleApprove = () => {
    const editedSets = state.sets.map((s) => ({
      weight: s.weight,
      reps: s.reps,
    }))
    if (pendingAction.data.actionType === 'addExerciseToSession') {
      onApprove({
        actionType: 'addExerciseToSession',
        exerciseId: pendingAction.data.exerciseId,
        exerciseName: pendingAction.data.exerciseName,
        sets: editedSets,
      })
      return
    }
    onApprove({
      actionType: 'addExerciseAndLog',
      name: pendingAction.data.name,
      sets: editedSets,
    })
  }

  return (
    <>
      <div className="mb-3 flex flex-col gap-2">
        <div className="font-semibold text-gym-black">{exerciseLabel}</div>
        <div className="flex flex-col gap-2">
          {state.sets.map((s, setIdx) => (
            <EditableSetRow
              key={setIdx}
              setNumber={setIdx + 1}
              weight={s.weight}
              reps={s.reps}
              isSettled={isSettled}
              onWeightChange={(v) => updateSet(setIdx, 'weight', v)}
              onRepsChange={(v) => updateSet(setIdx, 'reps', v)}
              onRemove={() => removeSet(setIdx)}
            />
          ))}
        </div>
        <AddSetButton isSettled={isSettled} onClick={addSet} />
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
