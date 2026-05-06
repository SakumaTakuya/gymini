import type {
  AddExerciseAndLogData,
  AddExerciseToSessionData,
  PendingAction,
  PendingActionData,
  SaveWorkoutData,
} from '../../types/chat'
import { ConfirmationActions } from './ConfirmationActions'
import { SaveWorkoutEditor } from './SaveWorkoutEditor'
import { SingleExerciseEditor } from './SingleExerciseEditor'

export type ConfirmationBubbleProps = {
  content: string
  pendingAction: PendingAction
  onApprove: (editedData?: PendingActionData) => void
  onReject: () => void
}

function getActionLabel(action: PendingAction): string {
  switch (action.data.actionType) {
    case 'saveWorkout':
      return '記録する'
    case 'addExercise':
      return '追加する'
    case 'addExerciseToSession':
      return '追加する'
    case 'addExerciseAndLog':
      return '追加して記録する'
  }
}

function isSaveWorkout(
  action: PendingAction,
): action is PendingAction & { data: SaveWorkoutData } {
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

function isAddAndLog(
  action: PendingAction,
): action is PendingAction & { data: AddExerciseAndLogData } {
  return action.data.actionType === 'addExerciseAndLog'
}

export function ConfirmationBubble({
  content,
  pendingAction,
  onApprove,
  onReject,
}: ConfirmationBubbleProps) {
  const isSettled = pendingAction.status !== 'pending'
  const label = getActionLabel(pendingAction)

  return (
    <div className="flex justify-start px-4 py-1">
      <div className="max-w-[88%] rounded-[18px] rounded-bl-[4px] bg-gym-white border border-gym-zinc-200 shadow-soft px-4 py-3 text-sm text-gym-black whitespace-pre-wrap break-words">
        <div className="mb-3">{content || pendingAction.description}</div>
        {renderBody()}
        {pendingAction.status === 'approved' && (
          <p className="mt-2 text-xs text-gym-zinc-500">実行済み</p>
        )}
        {pendingAction.status === 'rejected' && (
          <p className="mt-2 text-xs text-gym-zinc-500">キャンセル済み</p>
        )}
      </div>
    </div>
  )

  function renderBody() {
    if (isSaveWorkout(pendingAction)) {
      const { data } = pendingAction
      return (
        <SaveWorkoutEditor
          initialExercises={data.exercises}
          isSettled={isSettled}
          label={label}
          onApprove={(exercises) =>
            onApprove({ ...data, exercises })
          }
          onReject={onReject}
        />
      )
    }
    if (isAddSessionWithSets(pendingAction)) {
      const { data } = pendingAction
      return (
        <SingleExerciseEditor
          exerciseLabel={data.exerciseName}
          initialSets={data.sets}
          isSettled={isSettled}
          label={label}
          onApprove={(sets) => onApprove({ ...data, sets })}
          onReject={onReject}
        />
      )
    }
    if (isAddAndLog(pendingAction)) {
      const { data } = pendingAction
      return (
        <SingleExerciseEditor
          exerciseLabel={data.name}
          initialSets={data.sets}
          isSettled={isSettled}
          label={label}
          onApprove={(sets) => onApprove({ ...data, sets })}
          onReject={onReject}
        />
      )
    }
    return (
      <ConfirmationActions
        label={label}
        canApprove={!isSettled}
        isSettled={isSettled}
        onApprove={() => onApprove()}
        onReject={onReject}
      />
    )
  }
}
