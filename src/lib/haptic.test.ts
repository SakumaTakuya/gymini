import { describe, it, expect, afterEach } from 'vitest'
import { tactileVibrate } from './haptic'
import { setupHapticMocks } from '@/test/hapticMocks'

describe('tactileVibrate', () => {
  let restore: () => void = () => {}

  afterEach(() => {
    restore()
  })

  it('通常モードで navigator.vibrate(ms) を呼ぶ', () => {
    ;({ restore } = setupHapticMocks())
    tactileVibrate(10)
    expect(navigator.vibrate).toHaveBeenCalledWith(10)
  })

  it('prefers-reduced-motion: reduce の時は vibrate を呼ばない', () => {
    ;({ restore } = setupHapticMocks({ reducedMotion: true }))
    tactileVibrate(10)
    expect(navigator.vibrate).not.toHaveBeenCalled()
  })

  it('navigator.vibrate が未サポートのとき throw しない', () => {
    ;({ restore } = setupHapticMocks())
    Reflect.deleteProperty(navigator, 'vibrate')
    expect(() => tactileVibrate(10)).not.toThrow()
  })
})
