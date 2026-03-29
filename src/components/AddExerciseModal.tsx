import { useState } from 'react'
import type { Exercise } from '../types'
import useWorkoutSession from '../hooks/useWorkoutSession'
import { create as createExercise } from '../lib/exerciseRepository'

interface AddExerciseModalProps {
  open: boolean
  onClose: () => void
}

export default function AddExerciseModal({ open, onClose }: AddExerciseModalProps) {
  const { addExercise, searchExercises } = useWorkoutSession()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Exercise[]>([])

  if (!open) return null

  function handleSearch(q: string) {
    setQuery(q)
    setResults(searchExercises(q))
  }

  function handleSelect(exercise: Exercise) {
    addExercise({ exerciseId: exercise.id, exerciseName: exercise.name })
    setQuery('')
    setResults([])
    onClose()
  }

  function handleAutoRegister() {
    const trimmed = query.trim()
    if (!trimmed) return
    const exercise = createExercise(trimmed)
    addExercise({ exerciseId: exercise.id, exerciseName: exercise.name })
    setQuery('')
    setResults([])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="w-full bg-white rounded-t-2xl px-4 pt-4 pb-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-outfit font-bold text-lg">種目を追加</h2>
          <button
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-500"
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <input
          className="h-[52px] rounded-2xl bg-zinc-100 px-4 text-base font-inter"
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="種目を検索..."
          autoFocus
        />

        {query && results.length === 0 && (
          <ul className="rounded-2xl bg-zinc-100 overflow-hidden">
            <li
              className="px-4 py-3 font-inter text-base cursor-pointer hover:bg-zinc-200 text-blue-600"
              onClick={handleAutoRegister}
            >
              「{query.trim()}」を新しい種目として追加
            </li>
          </ul>
        )}

        {results.length > 0 && (
          <ul className="rounded-2xl bg-zinc-100 overflow-hidden">
            {results.map((ex) => (
              <li
                key={ex.id}
                className="px-4 py-3 font-inter text-base cursor-pointer hover:bg-zinc-200"
                onClick={() => handleSelect(ex)}
              >
                {ex.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
