import { ArrowDown, ArrowUp, CaretDown, CaretUp, DotsThree, Plus, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import type { DraftExercise, WorkoutSet } from '../../schemas/workout'
import { CompletedSetRow } from './CompletedSetRow'
import { PendingSetRow } from './PendingSetRow'

type ExerciseCardProps = {
  draftExercise: DraftExercise
  onActivate: () => void
  onComplete: (set: WorkoutSet) => void
  onEdit: (setIndex: number) => void
  onDelete: (setIndex: number) => void
  onDeleteExercise: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onToggle: () => void
  onWeightChange: (weight: number) => void
  onRepsChange: (reps: number) => void
}

export function ExerciseCard({
  draftExercise,
  onActivate,
  onComplete,
  onEdit,
  onDelete,
  onDeleteExercise,
  onMoveUp,
  onMoveDown,
  onToggle,
  onWeightChange,
  onRepsChange,
}: ExerciseCardProps) {
  const { exerciseName, sets, pendingSet, cardState } = draftExercise
  const isCollapsed = cardState === 'collapsed'
  const isRecording = cardState === 'recording'
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className={`mx-4 mb-3 bg-white rounded-[24px] p-5 shadow-sm border border-zinc-100 ${
        isCollapsed ? 'opacity-70' : ''
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-3 cursor-pointer ${
          !isCollapsed ? 'mb-4 border-b border-zinc-50 pb-3' : ''
        }`}
        onClick={onToggle}
      >
        <div className="relative flex-shrink-0">
          <button
            type="button"
            aria-label="種目メニュー"
            className="focus-ring w-8 h-8 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-500"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
            onBlur={() => { setTimeout(() => setMenuOpen(false), 150) }}
          >
            <DotsThree size={16} weight="bold" />
          </button>
          {menuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-zinc-200 z-50 py-1 min-w-[140px]">
              {onMoveUp && (
                <button
                  type="button"
                  className="focus-ring flex items-center gap-2 w-full px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                  onClick={(e) => { e.stopPropagation(); onMoveUp(); setMenuOpen(false) }}
                >
                  <ArrowUp size={14} weight="bold" />
                  上へ移動
                </button>
              )}
              {onMoveDown && (
                <button
                  type="button"
                  className="focus-ring flex items-center gap-2 w-full px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                  onClick={(e) => { e.stopPropagation(); onMoveDown(); setMenuOpen(false) }}
                >
                  <ArrowDown size={14} weight="bold" />
                  下へ移動
                </button>
              )}
              {(onMoveUp || onMoveDown) && <div className="my-1 border-t border-zinc-100" />}
              <button
                type="button"
                className="focus-ring flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                onClick={(e) => { e.stopPropagation(); onDeleteExercise(); setMenuOpen(false) }}
              >
                <Trash size={14} weight="bold" />
                削除
              </button>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-outfit font-bold text-lg text-black">
            {exerciseName}
          </h3>
          {isCollapsed && sets.length > 0 && (
            <p className="text-[10px] text-zinc-400 font-medium uppercase mt-0.5">
              {sets.length} Sets &bull; Last: {sets[sets.length - 1].weight}kg x{' '}
              {sets[sets.length - 1].reps}
            </p>
          )}
        </div>
        {isCollapsed ? (
          <CaretDown size={16} weight="bold" className="text-zinc-400 flex-shrink-0" />
        ) : (
          <CaretUp size={16} weight="bold" className="text-zinc-400 flex-shrink-0" />
        )}
      </div>

      {/* Body */}
      {!isCollapsed && (
        <>
          {/* Completed sets */}
          {sets.length > 0 && (
            <div className="space-y-1 mb-3">
              {sets.map((set, i) => (
                <CompletedSetRow
                  key={i}
                  set={set}
                  onEdit={() => onEdit(i)}
                  onDelete={() => onDelete(i)}
                />
              ))}
            </div>
          )}

          {/* Pending set (recording) */}
          {isRecording && pendingSet && (
            <div className="space-y-1">
              <PendingSetRow
                setNumber={sets.length + 1}
                pendingSet={pendingSet}
                onComplete={() => onComplete(pendingSet)}
                onWeightChange={onWeightChange}
                onRepsChange={onRepsChange}
              />
            </div>
          )}

          {/* Add button (idle state) */}
          {!isRecording && (
            <div className="flex justify-center py-1">
              <button
                type="button"
                onClick={onActivate}
                aria-label="追加"
                className="focus-ring w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 min-h-[44px] min-w-[44px]"
              >
                <Plus size={14} weight="bold" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
