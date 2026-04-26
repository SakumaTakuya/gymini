import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import type { Exercise } from '@/types'

type ExerciseSearchFieldProps = {
  onSelectExercise: (exercise: {
    exerciseId: string
    exerciseName: string
  }) => void
  searchExercises: (query: string) => Exercise[]
  createExercise: (name: string) => Exercise
}

export function ExerciseSearchField({
  onSelectExercise,
  searchExercises,
  createExercise,
}: ExerciseSearchFieldProps) {
  const [query, setQuery] = useState('')
  const [candidates, setCandidates] = useState<Exercise[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  const handleChange = (value: string) => {
    setQuery(value)
    if (value.trim() === '') {
      setCandidates([])
      setShowDropdown(false)
      return
    }
    const results = searchExercises(value)
    setCandidates(results)
    setShowDropdown(true)
  }

  const handleSelect = (exercise: Exercise) => {
    onSelectExercise({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
    })
    setQuery('')
    setCandidates([])
    setShowDropdown(false)
  }

  const handleCreateNew = () => {
    const trimmed = query.trim()
    if (!trimmed) return
    try {
      const newExercise = createExercise(trimmed)
      onSelectExercise({
        exerciseId: newExercise.id,
        exerciseName: newExercise.name,
      })
    } catch {
      // Duplicate or empty - ignore
    }
    setQuery('')
    setCandidates([])
    setShowDropdown(false)
  }

  const hasExactMatch = candidates.some(
    (c) => c.name.toLowerCase() === query.trim().toLowerCase(),
  )

  return (
    <div className="mx-4 relative">
      <div className="w-full h-[52px] bg-zinc-100 rounded-2xl px-4 flex items-center gap-3 border border-transparent">
        <Plus size={18} weight="bold" className="text-zinc-500 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (query.trim()) setShowDropdown(true)
          }}
          onBlur={() => {
            // Delay to allow click on dropdown items
            setTimeout(() => setShowDropdown(false), 200)
          }}
          placeholder="種目を追加..."
          className="flex-1 bg-transparent outline-none text-base font-medium text-black placeholder:text-zinc-500"
        />
      </div>

      {showDropdown && (query.trim() !== '') && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-zinc-200 z-50 max-h-48 overflow-y-auto">
          {candidates.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => handleSelect(exercise)}
              className="focus-ring w-full text-left px-4 py-3 text-sm font-medium text-black hover:bg-zinc-50 first:rounded-t-xl last:rounded-b-xl"
            >
              {exercise.name}
            </button>
          ))}
          {!hasExactMatch && query.trim() && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="focus-ring w-full text-left px-4 py-3 text-sm font-medium text-zinc-500 hover:bg-zinc-50 border-t border-zinc-100 last:rounded-b-xl"
            >
              「{query.trim()}」を新規追加
            </button>
          )}
        </div>
      )}
    </div>
  )
}
