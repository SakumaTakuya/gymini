import { z } from 'zod'

/**
 * 種目の対象部位（筋群）の全キー。配列の順序がそのまま表示順（凡例・ドット）になる。
 *
 * ★ 部位を増やす／減らすときはこの配列だけを編集する（唯一の定義元）。
 *    enum・型・表示順はすべてここから導出される。
 *    追加したら src/lib/exerciseCategory.ts の CATEGORY_META にラベルと色も足すこと
 *    （足し忘れると Record 型が満たされず TS がコンパイルエラーで知らせる）。
 * 'unassigned'（未分類）は既定値／旧データの移行先。末尾に置いておく。
 */
export const EXERCISE_CATEGORIES = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'cardio',
  'unassigned',
] as const

export const exerciseCategorySchema = z.enum(EXERCISE_CATEGORIES)

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number]

export const exerciseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  // category を持たない旧データは 'unassigned' に移行される（後方互換）。
  category: exerciseCategorySchema.default('unassigned'),
})

export type Exercise = z.infer<typeof exerciseSchema>
