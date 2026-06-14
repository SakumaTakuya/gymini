import { describe, it, expect } from 'vitest'
import { setupHapticMocks } from '@/test/hapticMocks'
import {
  prefersReducedMotion,
  staggerDelayMs,
  STAGGER_STEP_MS,
  STAGGER_MAX_STEPS,
} from './motion'

describe('motion', () => {
  describe('prefersReducedMotion', () => {
    it('reduce 設定時は true', () => {
      const { restore } = setupHapticMocks({ reducedMotion: true })
      expect(prefersReducedMotion()).toBe(true)
      restore()
    })

    it('非設定時は false', () => {
      const { restore } = setupHapticMocks({ reducedMotion: false })
      expect(prefersReducedMotion()).toBe(false)
      restore()
    })
  })

  describe('staggerDelayMs', () => {
    it('index 0 / 負数は遅延 0', () => {
      expect(staggerDelayMs(0)).toBe(0)
      expect(staggerDelayMs(-3)).toBe(0)
    })

    it('index に比例して STAGGER_STEP_MS 刻みで増える', () => {
      expect(staggerDelayMs(1)).toBe(STAGGER_STEP_MS)
      expect(staggerDelayMs(3)).toBe(3 * STAGGER_STEP_MS)
    })

    it('STAGGER_MAX_STEPS で打ち切る', () => {
      expect(staggerDelayMs(STAGGER_MAX_STEPS + 5)).toBe(
        STAGGER_MAX_STEPS * STAGGER_STEP_MS,
      )
    })
  })
})
