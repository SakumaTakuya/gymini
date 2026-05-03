import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import type { Exercise } from '@/types'
import { Input } from '@/components/ui/input'

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
      <Input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (query.trim()) setShowDropdown(true)
        }}
        onBlur={() => {
          setTimeout(() => setShowDropdown(false), 200)
        }}
        placeholder="種目を追加..."
        prefix={<Plus size={18} weight="bold" className="text-gym-zinc-500 flex-shrink-0" />}
        containerClassName="w-full h-[52px] rounded-2xl border-transparent gap-3"
      />

      {showDropdown && (query.trim() !== '') && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gym-white rounded-xl shadow-float border border-gym-zinc-200 z-50 max-h-48 overflow-y-auto">
          {candidates.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => handleSelect(exercise)}
              className="focus-ring w-full text-left px-4 py-3 text-sm font-medium text-gym-black hover:bg-gym-zinc-50 first:rounded-t-xl last:rounded-b-xl"
            >
              {exercise.name}
            </button>
          ))}
          {!hasExactMatch && query.trim() && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="focus-ring w-full text-left px-4 py-3 text-sm font-medium text-gym-zinc-500 hover:bg-gym-zinc-50 border-t border-gym-zinc-100 last:rounded-b-xl"
            >
              「{query.trim()}」を新規追加
            </button>
          )}
        </div>
      )}
    </div>
  )
}
