import { ArrowDown, ArrowUp, CaretDown, CaretUp, DotsThree, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import type { DraftExercise, WorkoutSet } from '../../schemas/workout'
import { IconButton } from '../ui/icon-button'
import { AddSetButton } from './AddSetButton'
import { CompletedSetRow } from './CompletedSetRow'
import { PendingSetRow } from './PendingSetRow'

// All callbacks that act on the set lifecycle (the pending set + completed sets).
export type ExerciseCardSetHandlers = {
  activate: () => void
  complete: (set: WorkoutSet) => void
  edit: (setIndex: number) => void
  remove: (setIndex: number) => void
  changeWeight: (weight: number) => void
  changeReps: (reps: number) => void
}

// All callbacks that act on the exercise as a whole.
export type ExerciseCardExerciseHandlers = {
  remove: () => void
  moveUp?: () => void
  moveDown?: () => void
  toggle: () => void
}

type ExerciseCardProps = {
  draftExercise: DraftExercise
  setHandlers: ExerciseCardSetHandlers
  exerciseHandlers: ExerciseCardExerciseHandlers
}

export function ExerciseCard({
  draftExercise,
  setHandlers,
  exerciseHandlers,
}: ExerciseCardProps) {
  const { exerciseName, sets, pendingSet, cardState, editingSetIndex } = draftExercise
  const isCollapsed = cardState === 'collapsed'
  const isRecording = cardState === 'recording'
  const [menuOpen, setMenuOpen] = useState(false)
  const { moveUp, moveDown } = exerciseHandlers

  return (
    <div
      className={`animate-appear relative mx-4 mb-3 bg-gym-white rounded-[24px] p-5 shadow-soft ${
        isCollapsed ? 'opacity-70' : ''
      } ${menuOpen ? 'z-10' : ''}`}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-3 ${
          !isCollapsed ? 'mb-4' : ''
        }`}
      >
        <div className="relative flex-shrink-0">
          <IconButton
            aria-label="種目メニュー"
            className="rounded-full bg-gym-zinc-50 text-gym-zinc-500"
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={() => { setTimeout(() => setMenuOpen(false), 150) }}
          >
            <DotsThree size={16} weight="bold" />
          </IconButton>
          {menuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-gym-white rounded-xl shadow-float border border-gym-zinc-200 z-50 py-1 min-w-[140px]">
              {moveUp && (
                <button
                  type="button"
                  className="focus-ring flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gym-zinc-600 hover:bg-gym-zinc-50"
                  onClick={(e) => { e.stopPropagation(); moveUp(); setMenuOpen(false) }}
                >
                  <ArrowUp size={14} weight="bold" />
                  上へ移動
                </button>
              )}
              {moveDown && (
                <button
                  type="button"
                  className="focus-ring flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gym-zinc-600 hover:bg-gym-zinc-50"
                  onClick={(e) => { e.stopPropagation(); moveDown(); setMenuOpen(false) }}
                >
                  <ArrowDown size={14} weight="bold" />
                  下へ移動
                </button>
              )}
              {(moveUp || moveDown) && <div className="my-1 border-t border-gym-zinc-100" />}
              <button
                type="button"
                className="focus-ring flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                onClick={(e) => { e.stopPropagation(); exerciseHandlers.remove(); setMenuOpen(false) }}
              >
                <Trash size={14} weight="bold" />
                削除
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          className="focus-ring flex flex-1 items-center gap-3 min-h-[44px] text-left"
          onClick={exerciseHandlers.toggle}
        >
          <div className="flex-1">
            <h3 className="font-outfit font-bold text-lg text-gym-black">
              {exerciseName}
            </h3>
            {isCollapsed && sets.length > 0 && (
              <p className="text-[10px] text-gym-zinc-400 font-medium uppercase mt-0.5">
                {sets.length} Sets &bull; Last: {sets[sets.length - 1].weight}kg x{' '}
                {sets[sets.length - 1].reps}
              </p>
            )}
          </div>
          {isCollapsed ? (
            <CaretDown size={16} weight="bold" className="text-gym-zinc-400 flex-shrink-0" />
          ) : (
            <CaretUp size={16} weight="bold" className="text-gym-zinc-400 flex-shrink-0" />
          )}
        </button>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <>
          {/* Sets list */}
          {(sets.length > 0 || isRecording) && (
            <div className={`space-y-1 ${!isRecording ? 'mb-3' : ''}`}>
              {isRecording && pendingSet ? (() => {
                const insertAt = editingSetIndex ?? sets.length
                return [
                  ...sets.slice(0, insertAt).map((set, i) => (
                    <CompletedSetRow key={i} setNumber={i + 1} set={set} onEdit={() => setHandlers.edit(i)} onDelete={() => setHandlers.remove(i)} />
                  )),
                  <PendingSetRow
                    key="pending"
                    setNumber={insertAt + 1}
                    pendingSet={pendingSet}
                    isEditing={editingSetIndex !== null}
                    onComplete={() => setHandlers.complete(pendingSet)}
                    onWeightChange={setHandlers.changeWeight}
                    onRepsChange={setHandlers.changeReps}
                  />,
                  ...sets.slice(insertAt).map((set, sliceI) => {
                    const idx = insertAt + sliceI
                    return (
                      <CompletedSetRow key={idx + 1} setNumber={idx + 1} set={set} onEdit={() => setHandlers.edit(idx)} onDelete={() => setHandlers.remove(idx)} />
                    )
                  }),
                ]
              })() : (
                sets.map((set, i) => (
                  <CompletedSetRow key={i} setNumber={i + 1} set={set} onEdit={() => setHandlers.edit(i)} onDelete={() => setHandlers.remove(i)} />
                ))
              )}
            </div>
          )}

          {/* Add button (idle state or editing a previous set) */}
          {(!isRecording || editingSetIndex !== null) && (
            <div className="flex justify-center py-1">
              <AddSetButton onClick={setHandlers.activate} aria-label="セットを追加" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
