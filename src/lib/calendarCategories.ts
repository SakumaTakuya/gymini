import type { DateString } from '../schemas/date'
import type { ExerciseCategory } from '../schemas/exercise'
import {
  CATEGORY_META,
  categoryColor,
  categoryLabel,
  sortCategories,
} from './exerciseCategory'

/** buildDayCategoryMap が必要とする最小のワークアウト形。 */
export interface WorkoutLike {
  date: DateString
  exercises: { exerciseId: string }[]
}

/**
 * ワークアウト群と「種目 id → 部位」対応から、日付ごとの部位一覧を作る。
 *
 * - 種目マスターに存在しない id（削除済みなど）は 'unassigned' にフォールバック。
 * - 各日の部位は CATEGORY_ORDER 準拠で安定ソートし重複を除く。
 *   → カレンダーの色ドットの並びを決定的にするため。
 */
export function buildDayCategoryMap(
  workouts: WorkoutLike[],
  categoryById: Map<string, ExerciseCategory>,
): Map<DateString, ExerciseCategory[]> {
  const acc = new Map<DateString, Set<ExerciseCategory>>()
  for (const workout of workouts) {
    let set = acc.get(workout.date)
    if (!set) {
      set = new Set<ExerciseCategory>()
      acc.set(workout.date, set)
    }
    for (const ex of workout.exercises) {
      set.add(categoryById.get(ex.exerciseId) ?? 'unassigned')
    }
  }

  const result = new Map<DateString, ExerciseCategory[]>()
  for (const [date, set] of acc) {
    result.set(date, sortCategories(set))
  }
  return result
}

/** カレンダーの日付セルに表示する 1 個分のドット。 */
export interface CalendarDot {
  color: string
  /** ツールチップ / aria 用ラベル。 */
  title: string
  /** 上限超過をまとめた「他N部位」ドットなら true。 */
  overflow: boolean
}

/**
 * 日付セルに出す色ドットを最大 max 個に丸める。
 * max を超える場合は先頭 (max-1) 個 + 「他N部位」のオーバーフロー・ドット。
 */
export function pickCalendarDots(
  categories: ExerciseCategory[],
  max = 3,
): CalendarDot[] {
  if (categories.length <= max) {
    return categories.map((c) => ({
      color: categoryColor(c),
      title: categoryLabel(c),
      overflow: false,
    }))
  }
  const dots: CalendarDot[] = categories.slice(0, max - 1).map((c) => ({
    color: categoryColor(c),
    title: categoryLabel(c),
    overflow: false,
  }))
  const remaining = categories.length - (max - 1)
  dots.push({
    color: CATEGORY_META.unassigned.color,
    title: `他${remaining}部位`,
    overflow: true,
  })
  return dots
}

/** その月に一度でも登場する部位一覧（凡例用、安定ソート済み）。 */
export function categoriesInMonth(
  dayCategories: Map<DateString, ExerciseCategory[]>,
): ExerciseCategory[] {
  const set = new Set<ExerciseCategory>()
  for (const cats of dayCategories.values()) {
    for (const c of cats) set.add(c)
  }
  return sortCategories(set)
}
