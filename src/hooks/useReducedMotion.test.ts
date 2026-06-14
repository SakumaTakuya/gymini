import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from './useReducedMotion'

type Listener = () => void

function mockMatchMedia(initial: boolean) {
  let matches = initial
  const listeners = new Set<Listener>()
  const mq = {
    get matches() {
      return matches
    },
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: (_: string, cb: Listener) => listeners.add(cb),
    removeEventListener: (_: string, cb: Listener) => listeners.delete(cb),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
  window.matchMedia = vi
    .fn()
    .mockReturnValue(mq) as unknown as typeof window.matchMedia
  return {
    set(v: boolean) {
      matches = v
      listeners.forEach((l) => l())
    },
  }
}

describe('useReducedMotion', () => {
  const original = window.matchMedia
  afterEach(() => {
    window.matchMedia = original
  })

  it('初期状態を matchMedia から読む', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('change イベントで再評価する', () => {
    const ctl = mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    act(() => ctl.set(true))
    expect(result.current).toBe(true)
  })
})
