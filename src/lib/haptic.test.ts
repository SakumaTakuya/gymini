import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { tactileVibrate } from './haptic'

type MediaQueryListLike = {
  matches: boolean
  media: string
  onchange: null
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  addListener: ReturnType<typeof vi.fn>
  removeListener: ReturnType<typeof vi.fn>
  dispatchEvent: ReturnType<typeof vi.fn>
}

function mockMatchMedia(reducedMotion: boolean): void {
  window.matchMedia = vi.fn().mockImplementation((q: string): MediaQueryListLike => ({
    matches: q === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('tactileVibrate', () => {
  const originalMatchMedia = window.matchMedia
  const originalVibrate = (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }).vibrate

  beforeEach(() => {
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn().mockReturnValue(true), writable: true, configurable: true })
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    if (originalVibrate === undefined) {
      Reflect.deleteProperty(navigator, 'vibrate')
    } else {
      Object.defineProperty(navigator, 'vibrate', { value: originalVibrate, writable: true, configurable: true })
    }
  })

  it('通常モードで navigator.vibrate(ms) を呼ぶ', () => {
    mockMatchMedia(false)
    tactileVibrate(10)
    expect(navigator.vibrate).toHaveBeenCalledWith(10)
  })

  it('prefers-reduced-motion: reduce の時は vibrate を呼ばない', () => {
    mockMatchMedia(true)
    tactileVibrate(10)
    expect(navigator.vibrate).not.toHaveBeenCalled()
  })

  it('navigator.vibrate が未サポートのとき throw しない', () => {
    mockMatchMedia(false)
    Reflect.deleteProperty(navigator, 'vibrate')
    expect(() => tactileVibrate(10)).not.toThrow()
  })
})
