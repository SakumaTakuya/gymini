import { describe, it, expect, vi } from 'vitest'
import { onSessionReset, emitSessionReset } from './sessionEvents'

describe('sessionEvents', () => {
  it('emitSessionReset は登録済みリスナーを呼ぶ', () => {
    const listener = vi.fn()
    onSessionReset(listener)
    emitSessionReset()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('onSessionReset が返す関数で購読解除できる', () => {
    const listener = vi.fn()
    const unsubscribe = onSessionReset(listener)
    unsubscribe()
    emitSessionReset()
    expect(listener).not.toHaveBeenCalled()
  })

  it('複数リスナーをすべて呼ぶ', () => {
    const a = vi.fn()
    const b = vi.fn()
    const offA = onSessionReset(a)
    const offB = onSessionReset(b)
    emitSessionReset()
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
    offA()
    offB()
  })
})
