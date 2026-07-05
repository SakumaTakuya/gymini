import { describe, it, expect } from 'vitest'
import type { DateString } from '../schemas/date'
import type { ExerciseCategory } from '../schemas/exercise'
import {
  buildDayCategoryMap,
  categoriesInMonth,
  pickCalendarDots,
  type WorkoutLike,
} from './calendarCategories'
import { CATEGORY_META, categoryColor } from './exerciseCategory'

const d = (s: string) => s as DateString

describe('buildDayCategoryMap', () => {
  const categoryById = new Map<string, ExerciseCategory>([
    ['e-bench', 'chest'],
    ['e-squat', 'legs'],
    ['e-row', 'back'],
  ])

  it('日付ごとに部位を集約し安定ソートする', () => {
    const workouts: WorkoutLike[] = [
      { date: d('2026-04-10'), exercises: [{ exerciseId: 'e-squat' }, { exerciseId: 'e-bench' }] },
    ]
    const map = buildDayCategoryMap(workouts, categoryById)
    // CATEGORY_ORDER 準拠で chest が legs より先
    expect(map.get(d('2026-04-10'))).toEqual(['chest', 'legs'])
  })

  it('同日の複数ワークアウトをマージし重複部位を除く', () => {
    const workouts: WorkoutLike[] = [
      { date: d('2026-04-10'), exercises: [{ exerciseId: 'e-bench' }] },
      { date: d('2026-04-10'), exercises: [{ exerciseId: 'e-bench' }, { exerciseId: 'e-row' }] },
    ]
    const map = buildDayCategoryMap(workouts, categoryById)
    expect(map.get(d('2026-04-10'))).toEqual(['chest', 'back'])
  })

  it('マスターに無い種目 id は unassigned にフォールバックする', () => {
    const workouts: WorkoutLike[] = [
      { date: d('2026-04-11'), exercises: [{ exerciseId: 'deleted' }] },
    ]
    const map = buildDayCategoryMap(workouts, categoryById)
    expect(map.get(d('2026-04-11'))).toEqual(['unassigned'])
  })

  it('ワークアウトが無ければ空の Map', () => {
    expect(buildDayCategoryMap([], categoryById).size).toBe(0)
  })
})

describe('pickCalendarDots', () => {
  it('3個以下はそのまま色ドットにする', () => {
    const dots = pickCalendarDots(['chest', 'back'])
    expect(dots).toHaveLength(2)
    expect(dots[0]).toEqual({ color: categoryColor('chest'), title: '胸', overflow: false })
    expect(dots.every((x) => !x.overflow)).toBe(true)
  })

  it('ちょうど3個は3ドット（オーバーフローなし）', () => {
    const dots = pickCalendarDots(['chest', 'back', 'legs'])
    expect(dots).toHaveLength(3)
    expect(dots.some((x) => x.overflow)).toBe(false)
  })

  it('3個超は先頭2 + 「他N部位」のオーバーフロードット', () => {
    const dots = pickCalendarDots(['chest', 'back', 'legs', 'arms', 'core'])
    expect(dots).toHaveLength(3)
    expect(dots[2]).toEqual({
      color: CATEGORY_META.unassigned.color,
      title: '他3部位',
      overflow: true,
    })
  })

  it('max を変更できる', () => {
    const dots = pickCalendarDots(['chest', 'back', 'legs'], 2)
    expect(dots).toHaveLength(2)
    expect(dots[1].overflow).toBe(true)
    expect(dots[1].title).toBe('他2部位')
  })
})

describe('categoriesInMonth', () => {
  it('その月に登場する部位を安定ソートで返す', () => {
    const map = new Map<DateString, ExerciseCategory[]>([
      [d('2026-04-10'), ['legs']],
      [d('2026-04-12'), ['chest', 'legs']],
    ])
    expect(categoriesInMonth(map)).toEqual(['chest', 'legs'])
  })

  it('空 Map は空配列', () => {
    expect(categoriesInMonth(new Map())).toEqual([])
  })
})
