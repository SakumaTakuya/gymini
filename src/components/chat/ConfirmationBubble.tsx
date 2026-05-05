import { Check, Plus, X } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import type {
  AddExerciseToSessionData,
  PendingAction,
  PendingActionData,
  SaveWorkoutData,
} from '../../types/chat'
import { cn } from '../../lib/utils'
import { Input } from '../ui/input'

export type ConfirmationBubbleProps = {
  content: string
  pendingAction: PendingAction
  onApprove: (editedData?: PendingActionData) => void
  onReject: () => void
}

type SaveWorkoutFormState = {
  exercises: Array<{
    exerciseName: string
    sets: Array<{ weight: number; reps: number }>
  }>
}

type AddSessionFormState = {
  sets: Array<{ weight: number; reps: number }>
}

function getActionLabel(action: PendingAction): string {
  switch (action.data.actionType) {
    case 'saveWorkout':
      return '記録する'
    case 'addExercise':
      return '追加する'
    case 'addExerciseToSession':
      return '追加する'
  }
}

function isSaveWorkoutEditable(action: PendingAction): action is PendingAction & {
  data: SaveWorkoutData
} {
  return action.data.actionType === 'saveWorkout'
}

function isAddSessionWithSets(action: PendingAction): action is PendingAction & {
  data: AddExerciseToSessionData & {
    sets: Array<{ weight: number; reps: number }>
  }
} {
  return (
    action.data.actionType === 'addExerciseToSession' &&
    Array.isArray(action.data.sets) &&
    action.data.sets.length > 0
  )
}

function EditableSetRow({
  setNumber,
  weight,
  reps,
  isSettled,
  onWeightChange,
  onRepsChange,
  onRemove,
}: {
  setNumber: number
  weight: number
  reps: number
  isSettled: boolean
  onWeightChange: (n: number) => void
  onRepsChange: (n: number) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-3 py-2 px-2 rounded-xl border border-gym-zinc-200 bg-gym-white shadow-soft relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gym-black" />
      <div className="w-6 h-6 rounded bg-gym-zinc-100 flex items-center justify-center text-gym-black ml-1">
        <span className="font-outfit font-bold text-xs">{setNumber}</span>
      </div>
      <div className="flex-1 flex gap-6">
        <Input
          type="number"
          value={weight === 0 ? '' : weight}
          placeholder="kg"
          onChange={(e) => onWeightChange(Number(e.target.value))}
          inputMode="decimal"
          disabled={isSettled}
          suffix={<span className="text-xs font-medium text-gym-zinc-400">kg</span>}
          containerClassName="items-baseline gap-1 h-auto pb-0.5"
          className="w-12 text-xl font-outfit font-bold"
        />
        <Input
          type="number"
          value={reps === 0 ? '' : reps}
          placeholder="回"
          onChange={(e) => onRepsChange(Number(e.target.value))}
          inputMode="numeric"
          disabled={isSettled}
          suffix={<span className="text-xs font-medium text-gym-zinc-400">回</span>}
          containerClassName="items-baseline gap-1 h-auto pb-0.5"
          className="w-10 text-xl font-outfit font-bold"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={isSettled}
        aria-label="セットを削除"
        className={cn(
          'focus-ring min-h-[44px] min-w-[44px] flex items-center justify-center',
          'rounded text-gym-zinc-500 hover:text-gym-black',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  )
}

export function ConfirmationBubble({
  content,
  pendingAction,
  onApprove,
  onReject,
}: ConfirmationBubbleProps) {
  const isSettled = pendingAction.status !== 'pending'
  const label = getActionLabel(pendingAction)
  const editableSaveWorkout = isSaveWorkoutEditable(pendingAction)
  const editableAddSession = isAddSessionWithSets(pendingAction)
  const isEditable = editableSaveWorkout || editableAddSession

  const initialSaveState = useMemo<SaveWorkoutFormState>(() => {
    if (editableSaveWorkout) {
      return {
        exercises: pendingAction.data.exercises.map((ex) => ({
          exerciseName: ex.exerciseName,
          sets: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
        })),
      }
    }
    return { exercises: [] }
  }, [editableSaveWorkout, pendingAction.data])

  const initialAddSessionState = useMemo<AddSessionFormState>(() => {
    if (editableAddSession) {
      return {
        sets: pendingAction.data.sets.map((s) => ({
          weight: s.weight,
          reps: s.reps,
        })),
      }
    }
    return { sets: [] }
  }, [editableAddSession, pendingAction.data])

  const [saveState, setSaveState] =
    useState<SaveWorkoutFormState>(initialSaveState)
  const [addSessionState, setAddSessionState] = useState<AddSessionFormState>(
    initialAddSessionState,
  )

  const totalSets = editableSaveWorkout
    ? saveState.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    : editableAddSession
      ? addSessionState.sets.length
      : 1
  const allSetsFilled = editableSaveWorkout
    ? saveState.exercises.every(
        (ex) => ex.sets.length > 0 && ex.sets.every((s) => s.weight > 0 && s.reps > 0),
      )
    : editableAddSession
      ? addSessionState.sets.every((s) => s.weight > 0 && s.reps > 0)
      : true
  const canApprove = !isSettled && totalSets > 0 && allSetsFilled
  const showFillHint =
    !isSettled && (editableSaveWorkout || editableAddSession) && totalSets > 0 && !allSetsFilled

  const handleApprove = () => {
    if (editableSaveWorkout) {
      onApprove({
        actionType: 'saveWorkout',
        date: pendingAction.data.date,
        exercises: saveState.exercises.map((ex) => ({
          exerciseName: ex.exerciseName,
          sets: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
        })),
      })
      return
    }
    if (editableAddSession) {
      onApprove({
        actionType: 'addExerciseToSession',
        exerciseId: pendingAction.data.exerciseId,
        exerciseName: pendingAction.data.exerciseName,
        sets: addSessionState.sets.map((s) => ({
          weight: s.weight,
          reps: s.reps,
        })),
      })
      return
    }
    onApprove()
  }

  const updateSaveSet = (
    exIdx: number,
    setIdx: number,
    field: 'weight' | 'reps',
    value: number,
  ) => {
    setSaveState((prev) => {
      const exercises = prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex
        const sets = ex.sets.map((s, j) =>
          j === setIdx ? { ...s, [field]: value } : s,
        )
        return { ...ex, sets }
      })
      return { exercises }
    })
  }

  const removeSaveSet = (exIdx: number, setIdx: number) => {
    setSaveState((prev) => {
      const exercises = prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex
        return { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
      })
      return { exercises }
    })
  }

  const addSaveSet = (exIdx: number) => {
    setSaveState((prev) => {
      const exercises = prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex
        const last = ex.sets[ex.sets.length - 1] ?? { weight: 0, reps: 0 }
        return { ...ex, sets: [...ex.sets, { weight: last.weight, reps: last.reps }] }
      })
      return { exercises }
    })
  }

  const updateAddSessionSet = (
    setIdx: number,
    field: 'weight' | 'reps',
    value: number,
  ) => {
    setAddSessionState((prev) => ({
      sets: prev.sets.map((s, i) =>
        i === setIdx ? { ...s, [field]: value } : s,
      ),
    }))
  }

  const removeAddSessionSet = (setIdx: number) => {
    setAddSessionState((prev) => ({
      sets: prev.sets.filter((_, i) => i !== setIdx),
    }))
  }

  const addAddSessionSet = () => {
    setAddSessionState((prev) => {
      const last = prev.sets[prev.sets.length - 1] ?? { weight: 0, reps: 0 }
      return {
        sets: [...prev.sets, { weight: last.weight, reps: last.reps }],
      }
    })
  }

  return (
    <div className="flex justify-start px-4 py-1">
      <div className="max-w-[88%] rounded-[18px] rounded-bl-[4px] bg-gym-white border border-gym-zinc-200 shadow-soft px-4 py-3 text-sm text-gym-black whitespace-pre-wrap break-words">
        <div className={cn(isEditable ? 'mb-3' : 'mb-3')}>
          {content || pendingAction.description}
        </div>

        {editableSaveWorkout && (
          <div className="mb-3 flex flex-col gap-3">
            {saveState.exercises.map((ex, exIdx) => (
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
                      onWeightChange={(v) => updateSaveSet(exIdx, setIdx, 'weight', v)}
                      onRepsChange={(v) => updateSaveSet(exIdx, setIdx, 'reps', v)}
                      onRemove={() => removeSaveSet(exIdx, setIdx)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addSaveSet(exIdx)}
                  disabled={isSettled}
                  className={cn(
                    'focus-ring inline-flex items-center justify-center gap-1.5',
                    'h-10 px-3 rounded-xl border border-dashed border-gym-zinc-300',
                    'text-xs font-semibold text-gym-zinc-600 hover:text-gym-black',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                  )}
                >
                  <Plus size={12} weight="bold" />
                  セットを追加
                </button>
              </div>
            ))}
          </div>
        )}

        {editableAddSession && (
          <div className="mb-3 flex flex-col gap-2">
            <div className="font-semibold text-gym-black">
              {pendingAction.data.actionType === 'addExerciseToSession'
                ? pendingAction.data.exerciseName
                : ''}
            </div>
            <div className="flex flex-col gap-2">
              {addSessionState.sets.map((s, setIdx) => (
                <EditableSetRow
                  key={setIdx}
                  setNumber={setIdx + 1}
                  weight={s.weight}
                  reps={s.reps}
                  isSettled={isSettled}
                  onWeightChange={(v) => updateAddSessionSet(setIdx, 'weight', v)}
                  onRepsChange={(v) => updateAddSessionSet(setIdx, 'reps', v)}
                  onRemove={() => removeAddSessionSet(setIdx)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addAddSessionSet}
              disabled={isSettled}
              className={cn(
                'focus-ring inline-flex items-center justify-center gap-1.5',
                'h-10 px-3 rounded-xl border border-dashed border-gym-zinc-300',
                'text-xs font-semibold text-gym-zinc-600 hover:text-gym-black',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              <Plus size={12} weight="bold" />
              セットを追加
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            disabled={isSettled}
            onClick={onReject}
            className={cn(
              'focus-ring flex-1 h-11 rounded-xl font-semibold',
              'bg-gym-zinc-100 text-gym-black',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            キャンセル
          </button>
          <button
            type="button"
            disabled={!canApprove}
            onClick={handleApprove}
            className={cn(
              'focus-ring flex-1 h-11 rounded-xl font-bold',
              'bg-gym-black text-gym-white inline-flex items-center justify-center gap-1.5',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            <Check size={16} weight="bold" />
            {label}
          </button>
        </div>
        {showFillHint && (
          <p className="mt-2 text-xs text-gym-zinc-500">
            重量と回数を入力してください
          </p>
        )}
        {pendingAction.status === 'approved' && (
          <p className="mt-2 text-xs text-gym-zinc-500">実行済み</p>
        )}
        {pendingAction.status === 'rejected' && (
          <p className="mt-2 text-xs text-gym-zinc-500">キャンセル済み</p>
        )}
      </div>
    </div>
  )
}
