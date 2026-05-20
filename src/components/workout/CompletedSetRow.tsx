import { Trash, PencilSimple } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { WorkoutSet } from '../../schemas/workout'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'

type CompletedSetRowProps = {
  setNumber: number
  set: WorkoutSet
  onEdit: () => void
  onDelete: () => void
}

const FALLBACK_ROW_WIDTH = 320

export function CompletedSetRow({ setNumber, set, onEdit, onDelete }: CompletedSetRowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rowWidth, setRowWidth] = useState(0)

  useEffect(() => {
    if (containerRef.current) {
      setRowWidth(containerRef.current.offsetWidth)
    }
  }, [])

  const {
    ref: swipeRef,
    style: swipeStyle,
    onPointerDown: swipeOnPointerDown,
    onPointerMove: swipeOnPointerMove,
    onPointerUp: swipeOnPointerUp,
    onPointerCancel: swipeOnPointerCancel,
    displacement,
  } = useSwipeGesture<HTMLDivElement>({
    rowWidthPx: rowWidth || FALLBACK_ROW_WIDTH,
    onCommitLeft: onDelete,
    onCommitRight: onEdit,
  })

  const showDeleteBg = displacement < 0
  const showEditBg = displacement > 0

  return (
    <div
      ref={containerRef}
      data-testid="completed-set-row"
      className="animate-pop relative overflow-hidden rounded-xl"
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-gym-accent flex items-center justify-end pr-6 rounded-xl ${
          showDeleteBg ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Trash size={20} weight="bold" className="text-gym-white" />
      </div>
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-gym-zinc-200 flex items-center justify-start pl-6 rounded-xl ${
          showEditBg ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <PencilSimple size={20} weight="bold" className="text-gym-zinc-600" />
      </div>
      <div
        data-testid="completed-set-foreground"
        ref={swipeRef}
        style={swipeStyle}
        onPointerDown={swipeOnPointerDown}
        onPointerMove={swipeOnPointerMove}
        onPointerUp={swipeOnPointerUp}
        onPointerCancel={swipeOnPointerCancel}
        className="relative overflow-hidden flex items-center gap-3 py-2 px-2 bg-gym-zinc-50 rounded-xl touch-pan-y"
      >
        <span
          data-testid="completed-set-watermark"
          aria-hidden="true"
          className="absolute right-0 top-0 bottom-0 flex items-center pr-4 font-outfit font-bold text-5xl text-gym-zinc-200 pointer-events-none select-none tabular-nums"
        >
          {setNumber}
        </span>
        <button
          type="button"
          onClick={onDelete}
          aria-label="削除"
          className="sr-only"
        >
          削除
        </button>
        <div className="relative z-10 flex-1 flex gap-6 pl-2">
          <p className="font-outfit font-semibold text-2xl text-gym-black tabular-nums">
            {set.weight}{' '}
            <span className="text-[10px] font-normal text-gym-zinc-400">kg</span>
          </p>
          <p className="font-outfit font-semibold text-2xl text-gym-black tabular-nums">
            {set.reps}{' '}
            <span className="text-[10px] font-normal text-gym-zinc-400">回</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="編集"
          className="sr-only"
        >
          編集
        </button>
      </div>
    </div>
  )
}
