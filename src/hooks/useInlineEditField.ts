import { useState } from 'react'

// Manages the value + error lifecycle of one inline text field that commits to a
// repository which may throw (e.g. duplicate name). Used for both the "add" and
// "edit" rows in ExerciseMasterSection so the trim / try-catch / error-mapping
// logic is not duplicated. Activation state (which row is open) stays in the
// component since add and edit differ there.
export function useInlineEditField(mapError: (err: unknown) => string | null) {
  const [value, setValueState] = useState('')
  const [error, setError] = useState<string | null>(null)

  const setValue = (next: string) => {
    setValueState(next)
    setError(null)
  }

  const reset = (initial = '') => {
    setValueState(initial)
    setError(null)
  }

  // Runs save(trimmed) and returns whether the caller should close the field:
  // true on success or empty input (treated as cancel); false when a mapped error
  // is shown so the field stays open for correction.
  const commit = (save: (trimmed: string) => void): boolean => {
    const trimmed = value.trim()
    if (trimmed === '') return true
    try {
      save(trimmed)
      return true
    } catch (err) {
      const mapped = mapError(err)
      if (mapped !== null) {
        setError(mapped)
        return false
      }
      return true
    }
  }

  return { value, error, setValue, reset, commit }
}
