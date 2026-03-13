import React, { useState, useEffect } from 'react'
import useWorkoutSession from '../hooks/useWorkoutSession'
import ExerciseSection from '../components/ExerciseSection'

export default function WorkoutFormPage({ onSave, onCancel, editWorkout = null }) {
  const {
    draftDate,
    draftExercises,
    draftMemo,
    startSession,
    startEditSession,
    addExercise,
    addSet,
    updateSet,
    setDraftMemo,
    saveSession,
    cancelSession,
    searchExercises,
  } = useWorkoutSession()

  const [exerciseQuery, setExerciseQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [lastAddedIndex, setLastAddedIndex] = useState(null)

  useEffect(() => {
    if (editWorkout) {
      startEditSession(editWorkout)
    } else {
      startSession()
    }
  }, [])

  function handleExerciseSearch(query) {
    setExerciseQuery(query)
    setSearchResults(searchExercises(query))
  }

  function handleSelectExercise(exercise) {
    addExercise({ exerciseId: exercise.id, exerciseName: exercise.name })
    setLastAddedIndex(draftExercises.length)
    setExerciseQuery('')
    setSearchResults([])
  }

  function handlePendingSetChange(exerciseIndex, pendingSet) {
    // Update pendingSet in store via updatePendingSet_internal is not exposed,
    // so we handle this locally in ExerciseSection/SetRowInput and pass to addSet
  }

  function handleAddSet(exerciseIndex, pendingSet) {
    addSet(exerciseIndex, pendingSet)
    setLastAddedIndex(exerciseIndex)
  }

  function handleUpdateSet(exerciseIndex, setIndex, updatedSet) {
    updateSet(exerciseIndex, setIndex, updatedSet)
  }

  function handleSave() {
    saveSession()
    onSave()
  }

  function handleCancel() {
    cancelSession()
    onCancel()
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* NavBar */}
      <div className="h-[103px] bg-white border-b border-zinc-100 px-6 pt-[59px] pb-4 flex items-center justify-between">
        <h1 className="font-outfit font-extrabold text-[28px] tracking-tight">
          {editWorkout ? '編集' : '記録'}
        </h1>
        <button
          className="h-11 rounded-xl font-outfit font-semibold text-base px-4 text-black"
          onClick={handleCancel}
        >
          キャンセル
        </button>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-6 overflow-y-auto">
        {/* Date */}
        <div className="flex flex-col gap-1">
          <label className="font-outfit font-semibold text-[13px]">日付</label>
          <input
            className="h-[52px] rounded-2xl bg-zinc-100 px-4 text-base font-inter"
            type="date"
            value={draftDate}
            readOnly
          />
        </div>

        {/* Exercise sections */}
        {draftExercises.map((ex, i) => (
          <ExerciseSection
            key={i}
            exercise={ex}
            exerciseIndex={i}
            onAddSet={handleAddSet}
            onUpdateSet={handleUpdateSet}
            onPendingSetChange={handlePendingSetChange}
            autoFocus={lastAddedIndex === i}
          />
        ))}

        {/* Exercise search */}
        <div className="flex flex-col gap-2">
          <label className="font-outfit font-semibold text-[13px]">種目を追加</label>
          <input
            className="h-[52px] rounded-2xl bg-zinc-100 px-4 text-base font-inter"
            type="text"
            value={exerciseQuery}
            onChange={(e) => handleExerciseSearch(e.target.value)}
            placeholder="種目を検索..."
          />
          {searchResults.length > 0 && (
            <ul className="rounded-2xl bg-zinc-100 overflow-hidden">
              {searchResults.map((ex) => (
                <li
                  key={ex.id}
                  className="px-4 py-3 font-inter text-base cursor-pointer hover:bg-zinc-200"
                  onClick={() => handleSelectExercise(ex)}
                >
                  {ex.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Memo */}
        <div className="flex flex-col gap-1">
          <label className="font-outfit font-semibold text-[13px]">メモ</label>
          <textarea
            className="rounded-2xl bg-zinc-100 px-4 py-3 text-base font-inter min-h-[80px]"
            value={draftMemo}
            onChange={(e) => setDraftMemo(e.target.value)}
            placeholder="今日のトレーニングのメモ..."
          />
        </div>

        {/* Save button */}
        <button
          className="h-[52px] rounded-2xl bg-black text-white font-outfit font-bold text-base px-6"
          onClick={handleSave}
        >
          保存
        </button>
      </div>
    </div>
  )
}
