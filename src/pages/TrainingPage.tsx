import { useState } from 'react'
import type { Exercise, PendingSet, WorkoutSet } from '../types'
import useWorkoutSession from '../hooks/useWorkoutSession'
import { create } from '../lib/exerciseRepository'
import IdleView from '../components/IdleView'
import ExerciseSection from '../components/ExerciseSection'

export default function TrainingPage() {
  const {
    isActive,
    draftDate,
    draftExercises,
    draftMemo,
    startSession,
    addExercise,
    addSet,
    updateSet,
    updatePendingSet,
    setDraftMemo,
    saveSession,
    cancelSession,
    searchExercises,
  } = useWorkoutSession()

  const [exerciseQuery, setExerciseQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Exercise[]>([])
  const [lastAddedIndex, setLastAddedIndex] = useState<number | null>(null)

  function handleExerciseSearch(query: string) {
    setExerciseQuery(query)
    setSearchResults(searchExercises(query))
  }

  function handleSelectExercise(exercise: Exercise) {
    addExercise({ exerciseId: exercise.id, exerciseName: exercise.name })
    setLastAddedIndex(draftExercises.length)
    setExerciseQuery('')
    setSearchResults([])
  }

  function handleAutoRegister() {
    const trimmed = exerciseQuery.trim()
    if (!trimmed) return
    const exercise = create(trimmed)
    addExercise({ exerciseId: exercise.id, exerciseName: exercise.name })
    setLastAddedIndex(draftExercises.length)
    setExerciseQuery('')
    setSearchResults([])
  }

  function handlePendingSetChange(exerciseIndex: number, pendingSet: PendingSet) {
    updatePendingSet(exerciseIndex, pendingSet)
  }

  function handleAddSet(exerciseIndex: number, pendingSet: PendingSet) {
    addSet(exerciseIndex, pendingSet)
    setLastAddedIndex(exerciseIndex)
  }

  function handleUpdateSet(exerciseIndex: number, setIndex: number, updatedSet: WorkoutSet) {
    updateSet(exerciseIndex, setIndex, updatedSet)
  }

  if (!isActive) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <IdleView
          onStartTraining={() => startSession()}
          onOpenSettings={() => {/* TODO: settings */}}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* NavBar */}
      <div className="h-[103px] bg-white border-b border-zinc-100 px-6 pt-[59px] pb-4 flex items-center justify-between">
        <h1 className="font-outfit font-extrabold text-[28px] tracking-[-1px]">記録</h1>
        <button
          className="h-11 rounded-xl font-outfit font-semibold text-base px-4 text-black"
          onClick={cancelSession}
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
          {exerciseQuery && searchResults.length === 0 && (
            <ul className="rounded-2xl bg-zinc-100 overflow-hidden">
              <li
                className="px-4 py-3 font-inter text-base cursor-pointer hover:bg-zinc-200 text-blue-600"
                onClick={handleAutoRegister}
              >
                「{exerciseQuery.trim()}」を新しい種目として追加
              </li>
            </ul>
          )}
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
          onClick={saveSession}
        >
          保存
        </button>
      </div>
    </div>
  )
}
