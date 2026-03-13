import React from 'react'

export default function WorkoutCard({ workout, onDelete, onEdit }) {
  const summary = workout.exercises
    .map((ex) => `${ex.exerciseName} ${ex.sets.length}セット`)
    .join(' / ')

  return (
    <div className="h-20 rounded-[20px] bg-zinc-100 px-5 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-outfit font-bold text-base truncate">
          {workout.exercises[0]?.exerciseName || '種目なし'}
        </p>
        <p className="font-inter text-[13px] text-zinc-500 truncate">
          {workout.date} · {summary || 'セットなし'}
        </p>
      </div>
      {onEdit && (
        <button
          className="h-9 px-3 rounded-xl bg-zinc-200 font-outfit font-semibold text-sm text-black"
          onClick={() => onEdit(workout)}
          aria-label="編集"
        >
          編集
        </button>
      )}
      <button
        className="h-9 px-3 rounded-xl bg-red-500 font-outfit font-semibold text-sm text-white"
        onClick={() => onDelete(workout.id)}
        aria-label="削除"
      >
        削除
      </button>
    </div>
  )
}
