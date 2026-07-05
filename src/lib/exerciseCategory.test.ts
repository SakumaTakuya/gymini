import { describe, it, expect } from 'vitest'
import type { ExerciseCategory } from '../schemas/exercise'
import { EXERCISE_CATEGORIES } from '../schemas/exercise'
import {
  CATEGORY_ORDER,
  CATEGORY_META,
  SELECTABLE_CATEGORIES,
  categoryColor,
  categoryLabel,
  sortCategories,
} from './exerciseCategory'

describe('exerciseCategory', () => {
  it('全カテゴリにラベルと色メタを持つ', () => {
    for (const c of CATEGORY_ORDER) {
      expect(CATEGORY_META[c].label).toBeTruthy()
      expect(CATEGORY_META[c].color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('CATEGORY_ORDER は EXERCISE_CATEGORIES と一致する（唯一の定義元から導出）', () => {
    expect(CATEGORY_ORDER).toEqual([...EXERCISE_CATEGORIES])
  })

  it('CATEGORY_META のキーは enum と過不足なく一致する（追加漏れ検知）', () => {
    expect(Object.keys(CATEGORY_META).sort()).toEqual(
      [...EXERCISE_CATEGORIES].sort(),
    )
  })

  it("'unassigned' を必ず含む（既定値／移行先）", () => {
    expect(EXERCISE_CATEGORIES).toContain('unassigned')
  })

  it('SELECTABLE_CATEGORIES は unassigned を含まない', () => {
    expect(SELECTABLE_CATEGORIES).not.toContain('unassigned')
    expect(SELECTABLE_CATEGORIES.length).toBe(CATEGORY_ORDER.length - 1)
  })

  it('categoryLabel / categoryColor がメタを返す', () => {
    expect(categoryLabel('chest')).toBe('胸')
    expect(categoryColor('chest')).toBe(CATEGORY_META.chest.color)
  })

  it('sortCategories は CATEGORY_ORDER 順に並べ重複を除く', () => {
    const input: ExerciseCategory[] = ['legs', 'chest', 'chest', 'back']
    expect(sortCategories(input)).toEqual(['chest', 'back', 'legs'])
  })

  it('sortCategories は空入力で空配列', () => {
    expect(sortCategories([])).toEqual([])
  })
})
