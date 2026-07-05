import { useCallback, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { todayDateString } from '../schemas/date'
import type { DateString } from '../schemas/date'
import type { ExerciseCategory } from '../schemas/exercise'
import { queryKeys } from '../lib/queryKeys'
import { buildDayCategoryMap } from '../lib/calendarCategories'
import { useExercises } from './useExercises'
import * as WorkoutRepository from '../lib/workoutRepository'

export interface UseCalendarReturn {
  selectedDate: DateString
  displayMonth: { year: number; month: number }
  goToPrevMonth: () => void
  goToNextMonth: () => void
  selectDate: (date: DateString) => void
  daysWithWorkouts: Set<DateString>
  /** 日付ごとに、その日に鍛えた部位一覧（安定ソート済み）。 */
  dayCategories: Map<DateString, ExerciseCategory[]>
}

function parseMonth(month: string | undefined): { year: number; month: number } {
  if (month) {
    const match = month.match(/^(\d{4})-(\d{2})$/)
    if (match) {
      return { year: Number(match[1]), month: Number(match[2]) }
    }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function formatMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function useCalendar(): UseCalendarReturn {
  const search = useSearch({ strict: false }) as {
    month?: string
    date?: string
  }
  const navigate = useNavigate()

  const displayMonth = useMemo(() => parseMonth(search.month), [search.month])

  const selectedDate: DateString = (search.date as DateString) ?? todayDateString()

  const goToPrevMonth = useCallback(() => {
    const prev =
      displayMonth.month === 1
        ? { year: displayMonth.year - 1, month: 12 }
        : { year: displayMonth.year, month: displayMonth.month - 1 }
    navigate({
      to: '.',
      // date など他の search パラメータを保持したまま month のみ更新する。
      search: (prevSearch: Record<string, unknown>) => ({
        ...prevSearch,
        month: formatMonth(prev.year, prev.month),
      }),
    } as never)
  }, [displayMonth, navigate])

  const goToNextMonth = useCallback(() => {
    const next =
      displayMonth.month === 12
        ? { year: displayMonth.year + 1, month: 1 }
        : { year: displayMonth.year, month: displayMonth.month + 1 }
    navigate({
      to: '.',
      search: (prevSearch: Record<string, unknown>) => ({
        ...prevSearch,
        month: formatMonth(next.year, next.month),
      }),
    } as never)
  }, [displayMonth, navigate])

  const selectDate = useCallback(
    (date: DateString) => {
      navigate({
        to: '.',
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          date,
        }),
      } as never)
    },
    [navigate],
  )

  const { data: monthWorkouts = [] } = useQuery({
    queryKey: queryKeys.workoutDates(displayMonth.year, displayMonth.month),
    queryFn: () => {
      const all = WorkoutRepository.listByDateDesc()
      return all.filter((w) => {
        const [y, m] = w.date.split('-').map(Number)
        return y === displayMonth.year && m === displayMonth.month
      })
    },
    staleTime: 0,
  })

  // 部位色の解決元。種目マスターの編集に追従させるため store を購読する。
  const { exercises } = useExercises()

  const categoryById = useMemo(() => {
    const map = new Map<string, ExerciseCategory>()
    for (const e of exercises) map.set(e.id, e.category)
    return map
  }, [exercises])

  const daysWithWorkouts = useMemo(
    () => new Set(monthWorkouts.map((w) => w.date as DateString)),
    [monthWorkouts],
  )

  const dayCategories = useMemo(
    () => buildDayCategoryMap(monthWorkouts, categoryById),
    [monthWorkouts, categoryById],
  )

  return {
    selectedDate,
    displayMonth,
    goToPrevMonth,
    goToNextMonth,
    selectDate,
    daysWithWorkouts,
    dayCategories,
  }
}
