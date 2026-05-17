import { vi } from 'vitest'

type NavigatorWithOptionalVibrate = Navigator & { vibrate?: (pattern: number | number[]) => boolean }

export function setupHapticMocks(opts: { reducedMotion?: boolean } = {}): { restore: () => void } {
  const originalMatchMedia = window.matchMedia
  const originalVibrate = (navigator as NavigatorWithOptionalVibrate).vibrate

  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q === '(prefers-reduced-motion: reduce)' ? (opts.reducedMotion ?? false) : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  Object.defineProperty(navigator, 'vibrate', {
    value: vi.fn().mockReturnValue(true),
    writable: true,
    configurable: true,
  })

  return {
    restore: () => {
      window.matchMedia = originalMatchMedia
      if (originalVibrate === undefined) {
        Reflect.deleteProperty(navigator, 'vibrate')
      } else {
        Object.defineProperty(navigator, 'vibrate', {
          value: originalVibrate,
          writable: true,
          configurable: true,
        })
      }
    },
  }
}
