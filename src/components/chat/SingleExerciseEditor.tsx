import { useState } from 'react'
import { EditableSetRow } from './EditableSetRow'
import { AddSetButton } from '../workout/AddSetButton'
import { ConfirmationActions } from './ConfirmationActions'

type SetEdit = { weight: number; reps: number }

export type SingleExerciseEditorProps = {
  exerciseLabel: string
  initialSets: SetEdit[]
  isSettled: boolean
  label: string
  onApprove: (sets: SetEdit[]) => void
  onReject: () => void
  showLabel?: boolean
}

export function SingleExerciseEditor({
  exerciseLabel,
  initialSets,
  isSettled,
  label,
  onApprove,
  onReject,
  showLabel = true,
}: SingleExerciseEditorProps) {
  const [sets, setSets] = useState<SetEdit[]>(() =>
    initialSets.map((s) => ({ weight: s.weight, reps: s.reps })),
  )

  const allSetsFilled = sets.every((s) => s.weight > 0 && s.reps > 0)
  const canApprove = !isSettled && sets.length > 0 && allSetsFilled
  const showFillHint = !isSettled && sets.length > 0 && !allSetsFilled

  const updateSet = (
    setIdx: number,
    field: 'weight' | 'reps',
    value: number,
  ) => {
    setSets((prev) =>
      prev.map((s, i) => (i === setIdx ? { ...s, [field]: value } : s)),
    )
  }

  const removeSet = (setIdx: number) => {
    setSets((prev) => prev.filter((_, i) => i !== setIdx))
  }

  const addSet = () => {
    setSets((prev) => {
      const last = prev[prev.length - 1] ?? { weight: 0, reps: 0 }
      return [...prev, { weight: last.weight, reps: last.reps }]
    })
  }

  return (
    <>
      <div className="mb-3 flex flex-col gap-2">
        {showLabel && <div className="font-semibold text-gym-black">{exerciseLabel}</div>}
        <div className="flex flex-col gap-2">
          {sets.map((s, setIdx) => (
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
        <AddSetButton disabled={isSettled} onClick={addSet} label="セットを追加" aria-label="セットを追加" />
      </div>
      <ConfirmationActions
        label={label}
        canApprove={canApprove}
        isSettled={isSettled}
        onApprove={() => onApprove(sets)}
        onReject={onReject}
        showFillHint={showFillHint}
      />
    </>
  )
}
