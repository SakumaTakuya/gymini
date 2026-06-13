import type { DateString } from '../schemas/date'

export const queryKeys = {
  workoutDates: (year: number, month: number) =>
    ['workoutDates', year, month] as const,
  workoutsForDate: (date: DateString | null) =>
    ['workoutsForDate', date] as const,
  geminiModels: (apiKey: string) => ['geminiModels', apiKey] as const,
}
