// アニメーションの共通ロジック。prefers-reduced-motion 判定と stagger 遅延を
// ここに集約し、各コンポーネントで matchMedia や遅延計算を直書きしない。

/** stagger（連続出現）の 1 ステップあたりの遅延（ms）。 */
export const STAGGER_STEP_MS = 40

/** stagger 遅延の打ち切りステップ数。長いリストで遅延が累積しすぎないようにする。 */
export const STAGGER_MAX_STEPS = 8

/**
 * OS の「視差効果を減らす（prefers-reduced-motion: reduce）」設定を読む純関数。
 * React 外（haptic など）からも使えるよう、フックではなく関数で提供する。
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * stagger 出現の遅延（ms）を返す。index 0 / 負数は 0。
 * STAGGER_MAX_STEPS を超える index は打ち切る。
 */
export function staggerDelayMs(index: number): number {
  if (index <= 0) return 0
  return Math.min(index, STAGGER_MAX_STEPS) * STAGGER_STEP_MS
}
