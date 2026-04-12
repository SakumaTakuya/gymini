import { useQuery } from '@tanstack/react-query'
import type { DateString } from '../schemas/date'
import type { Workout } from '../schemas/workout'
import { queryKeys } from '../lib/queryKeys'
import * as WorkoutRepository from '../lib/workoutRepository'

export function useWorkoutsForDate(date: DateString): Workout[] {
  const { data = [] } = useQuery({
    queryKey: queryKeys.workoutsForDate(date),
    queryFn: () => WorkoutRepository.listByDate(date),
  })
  return data
}
