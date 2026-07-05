import type { ExerciseCategory } from '@/schemas/exercise'
import { EXERCISE_CATEGORIES } from '@/schemas/exercise'

/**
 * 部位カテゴリの表示メタ（唯一の定義元）。
 *
 * 色は Tailwind の動的クラスが使えないため hex を直接持ち、ドット/凡例は
 * inline style で参照する。CSS トークンには複製せず、ここを single source とする
 * （`docs/design/tokens.md` からも本ファイルを参照する運用）。
 *
 * ★ 部位の増減は schemas/exercise.ts の EXERCISE_CATEGORIES を編集し、
 *    併せて下の CATEGORY_META に対応するラベル・色を追加する（Record 型が全キーを要求
 *    するため、追加漏れはコンパイルエラーになる）。
 */
export interface CategoryMeta {
  /** 日本語ラベル（凡例・選択チップ） */
  label: string
  /** ドット / 凡例の表示色（hex） */
  color: string
}

/** 凡例・ドット・ソートで用いる表示順（= EXERCISE_CATEGORIES の順）。 */
export const CATEGORY_ORDER: readonly ExerciseCategory[] = EXERCISE_CATEGORIES

export const CATEGORY_META: Record<ExerciseCategory, CategoryMeta> = {
  chest: { label: '胸', color: '#DE3A2B' },
  back: { label: '背中', color: '#2563EB' },
  shoulders: { label: '肩', color: '#F59E0B' },
  arms: { label: '腕', color: '#9333EA' },
  legs: { label: '脚', color: '#16A34A' },
  core: { label: '体幹', color: '#0891B2' },
  cardio: { label: '有酸素', color: '#EC4899' },
  unassigned: { label: '未分類', color: '#A1A1AA' },
}

/** 種目に割り当て可能なカテゴリ（未分類を除く、表示順）。 */
export const SELECTABLE_CATEGORIES: ExerciseCategory[] = CATEGORY_ORDER.filter(
  (c) => c !== 'unassigned',
)

export function categoryLabel(category: ExerciseCategory): string {
  return CATEGORY_META[category].label
}

export function categoryColor(category: ExerciseCategory): string {
  return CATEGORY_META[category].color
}

/**
 * カテゴリ集合を CATEGORY_ORDER に沿って安定ソートし重複を除く。
 * カレンダーの色ドットの並び順を決定的にするために使う。
 */
export function sortCategories(
  categories: Iterable<ExerciseCategory>,
): ExerciseCategory[] {
  const set = new Set(categories)
  return CATEGORY_ORDER.filter((c) => set.has(c))
}
