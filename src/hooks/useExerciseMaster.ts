import { useState, useCallback } from 'react'
import type { Exercise } from '../types'
import { getAll, create, remove } from '../lib/exerciseRepository'

export default function useExerciseMaster() {
  const [exercises, setExercises] = useState<Exercise[]>(() => getAll())
  const [error, setError] = useState<string | null>(null)

  const addExercise = useCallback((name: string) => {
    try {
      create(name)
      setExercises(getAll())
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const removeExercise = useCallback((id: string) => {
    remove(id)
    setExercises(getAll())
  }, [])

  return { exercises, addExercise, removeExercise, error }
}
