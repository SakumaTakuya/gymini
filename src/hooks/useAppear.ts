import type { CSSProperties } from 'react'
import { staggerDelayMs } from '@/lib/motion'
import { useReducedMotion } from './useReducedMotion'

export type AppearBinding = {
  className: string
  style: CSSProperties
}

/**
 * マウント時の出現アニメ（animate-appear）を要素に乗せるための共通フック。
 * 返り値の className / style をそのまま要素に spread する。
 *
 * - 通常時: className = 'animate-appear'、index>0 なら style.animationDelay で stagger
 * - reduced-motion 時: className = ''、style = {}（出現アニメを完全に外す）
 *
 * @param index リスト内の位置。stagger 遅延の算出に使う（省略時 0 = 遅延なし）
 */
export function useAppear(index = 0): AppearBinding {
  const reduced = useReducedMotion()
  if (reduced) return { className: '', style: {} }

  const delay = staggerDelayMs(index)
  return {
    className: 'animate-appear',
    style: delay > 0 ? { animationDelay: `${delay}ms` } : {},
  }
}
