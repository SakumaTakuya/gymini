import { ArrowDown, ArrowUp, CaretDown, CaretUp, Check, DotsThree, Plus, Sparkle, Trash, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { DraftExercise, WorkoutSet } from '../../schemas/workout'
import { IconButton } from '../ui/icon-button'
import { SingleExerciseEditor } from '../chat/SingleExerciseEditor'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { CompletedSetRow } from './CompletedSetRow'
import { PendingSetRow } from './PendingSetRow'

const AI_CARD_FALLBACK_WIDTH = 360

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
  onAcceptSuggested?: (sets: WorkoutSet[]) => void
  onRejectSuggested?: () => void
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
  onAcceptSuggested,
  onRejectSuggested,
}: ExerciseCardProps) {
  const { exerciseName, sets, pendingSet, cardState, editingSetIndex, origin } = draftExercise
  const isCollapsed = cardState === 'collapsed'
  const isRecording = cardState === 'recording'
  const [menuOpen, setMenuOpen] = useState(false)

  if (origin === 'ai-suggested') {
    return (
      <AiSuggestedCard
        exerciseName={exerciseName}
        sets={sets}
        onAcceptSuggested={onAcceptSuggested}
        onRejectSuggested={onRejectSuggested}
      />
    )
  }

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
              {onMoveUp && (
                <button
                  type="button"
                  className="focus-ring flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gym-zinc-600 hover:bg-gym-zinc-50"
                  onClick={(e) => { e.stopPropagation(); onMoveUp(); setMenuOpen(false) }}
                >
                  <ArrowUp size={14} weight="bold" />
                  上へ移動
                </button>
              )}
              {onMoveDown && (
                <button
                  type="button"
                  className="focus-ring flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gym-zinc-600 hover:bg-gym-zinc-50"
                  onClick={(e) => { e.stopPropagation(); onMoveDown(); setMenuOpen(false) }}
                >
                  <ArrowDown size={14} weight="bold" />
                  下へ移動
                </button>
              )}
              {(onMoveUp || onMoveDown) && <div className="my-1 border-t border-gym-zinc-100" />}
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
        <button
          type="button"
          className="focus-ring flex flex-1 items-center gap-3 min-h-[44px] text-left"
          onClick={onToggle}
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
                    <CompletedSetRow key={i} setNumber={i + 1} set={set} onEdit={() => onEdit(i)} onDelete={() => onDelete(i)} />
                  )),
                  <PendingSetRow
                    key="pending"
                    setNumber={insertAt + 1}
                    pendingSet={pendingSet}
                    isEditing={editingSetIndex !== null}
                    onComplete={() => onComplete(pendingSet)}
                    onWeightChange={onWeightChange}
                    onRepsChange={onRepsChange}
                  />,
                  ...sets.slice(insertAt).map((set, sliceI) => {
                    const idx = insertAt + sliceI
                    return (
                      <CompletedSetRow key={idx + 1} setNumber={idx + 1} set={set} onEdit={() => onEdit(idx)} onDelete={() => onDelete(idx)} />
                    )
                  }),
                ]
              })() : (
                sets.map((set, i) => (
                  <CompletedSetRow key={i} setNumber={i + 1} set={set} onEdit={() => onEdit(i)} onDelete={() => onDelete(i)} />
                ))
              )}
            </div>
          )}

          {/* Add button (idle state or editing a previous set) */}
          {(!isRecording || editingSetIndex !== null) && (
            <div className="flex justify-center py-1">
              <IconButton
                onClick={onActivate}
                aria-label="追加"
                className="rounded-full bg-gym-zinc-100 text-gym-zinc-500"
              >
                <Plus size={14} weight="bold" />
              </IconButton>
            </div>
          )}
        </>
      )}
    </div>
  )
}

type AiSuggestedCardProps = {
  exerciseName: string
  sets: WorkoutSet[]
  onAcceptSuggested?: (sets: WorkoutSet[]) => void
  onRejectSuggested?: () => void
}

function AiSuggestedCard({
  exerciseName,
  sets,
  onAcceptSuggested,
  onRejectSuggested,
}: AiSuggestedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardWidth, setCardWidth] = useState(0)

  useEffect(() => {
    if (cardRef.current) setCardWidth(cardRef.current.offsetWidth)
  }, [])

  const {
    ref: swipeRef,
    style: swipeStyle,
    onPointerDown: swipeDown,
    onPointerMove: swipeMove,
    onPointerUp: swipeUp,
    onPointerCancel: swipeCancel,
    displacement,
  } = useSwipeGesture<HTMLDivElement>({
    rowWidthPx: cardWidth || AI_CARD_FALLBACK_WIDTH,
    onCommitLeft: () => onRejectSuggested?.(),
    onCommitRight: () => onAcceptSuggested?.(sets),
  })

  return (
    <div ref={cardRef} className="animate-appear relative mx-4 mb-3 overflow-hidden rounded-[24px]">
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-gym-zinc-200 flex items-center justify-end pr-8 rounded-[24px] ${
          displacement < 0 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <X size={24} weight="bold" className="text-gym-zinc-600" />
      </div>
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-emerald-50 flex items-center justify-start pl-8 rounded-[24px] ${
          displacement > 0 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Check size={24} weight="bold" className="text-emerald-600" />
      </div>
      <div
        data-testid="ai-card-foreground"
        ref={swipeRef}
        style={swipeStyle}
        className="relative bg-gym-white p-5 shadow-soft border border-dashed border-gym-zinc-300 rounded-[24px] touch-pan-y"
      >
        <div
          data-testid="ai-card-handle"
          onPointerDown={swipeDown}
          onPointerMove={swipeMove}
          onPointerUp={swipeUp}
          onPointerCancel={swipeCancel}
          className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gym-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gym-white cursor-grab active:cursor-grabbing select-none"
        >
          <Sparkle size={10} weight="fill" />
          AI 提案
        </div>
        <SingleExerciseEditor
          exerciseLabel={exerciseName}
          initialSets={sets}
          isSettled={false}
          label="保存"
          onApprove={(editedSets) => onAcceptSuggested?.(editedSets)}
          onReject={() => onRejectSuggested?.()}
        />
      </div>
    </div>
  )
}
