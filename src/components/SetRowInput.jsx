import React, { useRef, useEffect, useState } from 'react'

// Renders the pending set input row + confirmed sets list
export default function SetRowInput({
  pendingSet,
  onPendingSetChange,
  onAddSet,
  autoFocus = false,
  confirmedSets = [],
  onUpdateSet,
}) {
  const weightRef = useRef(null)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editValues, setEditValues] = useState({})

  useEffect(() => {
    if (autoFocus && weightRef.current) {
      weightRef.current.focus()
    }
  }, [autoFocus])

  function handlePendingChange(field, rawValue) {
    const value = field === 'memo' ? rawValue : Number(rawValue)
    onPendingSetChange({ ...pendingSet, [field]: value })
  }

  function handleEditStart(index) {
    setEditingIndex(index)
    setEditValues(confirmedSets[index])
  }

  function handleEditChange(field, rawValue) {
    const value = field === 'memo' ? rawValue : Number(rawValue)
    setEditValues((prev) => ({ ...prev, [field]: value }))
  }

  function handleEditCommit(index) {
    onUpdateSet && onUpdateSet(index, editValues)
    setEditingIndex(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Confirmed sets */}
      {confirmedSets.map((s, i) =>
        editingIndex === i ? (
          <div
            key={i}
            className="h-[52px] rounded-2xl bg-white border border-zinc-200 px-4 flex items-center gap-3"
          >
            <span className="font-outfit font-bold text-base text-zinc-400 w-5">{i + 1}</span>
            <input
              className="rounded-[10px] bg-zinc-100 h-9 px-3 font-inter font-medium text-[15px] w-16 text-center"
              type="number"
              value={editValues.weight}
              onChange={(e) => handleEditChange('weight', e.target.value)}
              aria-label="weight"
            />
            <span className="font-inter text-zinc-400 text-sm">kg</span>
            <input
              className="rounded-[10px] bg-zinc-100 h-9 px-3 font-inter font-medium text-[15px] w-16 text-center"
              type="number"
              value={editValues.reps}
              onChange={(e) => handleEditChange('reps', e.target.value)}
              aria-label="reps"
            />
            <span className="font-inter text-zinc-400 text-sm">回</span>
            <button
              className="ml-auto text-sm font-outfit font-semibold text-black"
              onClick={() => handleEditCommit(i)}
            >
              確定
            </button>
          </div>
        ) : (
          <div
            key={i}
            className="h-[52px] rounded-2xl bg-white border border-zinc-200 px-4 flex items-center gap-3 cursor-pointer"
            onClick={() => handleEditStart(i)}
          >
            <span className="font-outfit font-bold text-base text-zinc-400 w-5">{i + 1}</span>
            <span className="font-inter font-medium text-[15px] w-16 text-center">{s.weight}</span>
            <span className="font-inter text-zinc-400 text-sm">kg</span>
            <span className="font-inter font-medium text-[15px] w-16 text-center">{s.reps}</span>
            <span className="font-inter text-zinc-400 text-sm">回</span>
            {s.memo ? <span className="font-inter text-zinc-500 text-sm ml-2">{s.memo}</span> : null}
          </div>
        )
      )}

      {/* Pending set input */}
      <div className="h-[52px] rounded-2xl bg-white border border-zinc-200 px-4 flex items-center gap-3">
        <span className="font-outfit font-bold text-base text-zinc-400 w-5">
          {confirmedSets.length + 1}
        </span>
        <input
          ref={weightRef}
          className="rounded-[10px] bg-zinc-100 h-9 px-3 font-inter font-medium text-[15px] w-16 text-center"
          type="number"
          value={pendingSet.weight}
          onChange={(e) => handlePendingChange('weight', e.target.value)}
          aria-label="weight"
        />
        <span className="font-inter text-zinc-400 text-sm">kg</span>
        <input
          className="rounded-[10px] bg-zinc-100 h-9 px-3 font-inter font-medium text-[15px] w-16 text-center"
          type="number"
          value={pendingSet.reps}
          onChange={(e) => handlePendingChange('reps', e.target.value)}
          aria-label="reps"
        />
        <span className="font-inter text-zinc-400 text-sm">回</span>
        <input
          className="rounded-[10px] bg-zinc-100 h-9 px-3 font-inter font-medium text-[15px] flex-1 min-w-0"
          type="text"
          value={pendingSet.memo}
          onChange={(e) => handlePendingChange('memo', e.target.value)}
          placeholder="メモ"
          aria-label="memo"
        />
        <button
          className="ml-2 h-9 px-3 rounded-xl bg-black text-white font-outfit font-bold text-sm"
          onClick={onAddSet}
          aria-label="追加"
        >
          追加
        </button>
      </div>
    </div>
  )
}
