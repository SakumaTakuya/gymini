import { useEffect } from 'react'
import useWorkoutStore from '../stores/workoutStore'

export default function useWorkoutList() {
  const workouts = useWorkoutStore((s) => s.workouts)
  const loadWorkouts = useWorkoutStore((s) => s.loadWorkouts)
  const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout)

  useEffect(() => {
    loadWorkouts()
  }, [])

  return { workouts, deleteWorkout }
}
