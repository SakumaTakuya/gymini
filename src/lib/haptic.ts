import { prefersReducedMotion } from './motion'

export const HAPTIC_SET_COMPLETE_MS = 10
export const HAPTIC_SCROLL_EDGE_MS = 5

export function tactileVibrate(ms: number): void {
  if (typeof window === 'undefined') return
  if (prefersReducedMotion()) return
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(ms)
  }
}
