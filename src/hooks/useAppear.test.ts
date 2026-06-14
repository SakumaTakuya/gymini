import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { setupHapticMocks } from '@/test/hapticMocks'
import { STAGGER_STEP_MS } from '@/lib/motion'
import { useAppear } from './useAppear'

describe('useAppear', () => {
  it('通常時は animate-appear を返し style は空', () => {
    const { restore } = setupHapticMocks({ reducedMotion: false })
    const { result } = renderHook(() => useAppear())
    expect(result.current.className).toBe('animate-appear')
    expect(result.current.style).toEqual({})
    restore()
  })

  it('index>0 で animationDelay を付与', () => {
    const { restore } = setupHapticMocks({ reducedMotion: false })
    const { result } = renderHook(() => useAppear(2))
    expect(result.current.className).toBe('animate-appear')
    expect(result.current.style.animationDelay).toBe(`${2 * STAGGER_STEP_MS}ms`)
    restore()
  })

  it('reduced-motion 時はクラス無し・style 空', () => {
    const { restore } = setupHapticMocks({ reducedMotion: true })
    const { result } = renderHook(() => useAppear(2))
    expect(result.current.className).toBe('')
    expect(result.current.style).toEqual({})
    restore()
  })
})
