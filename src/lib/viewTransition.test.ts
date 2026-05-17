import { describe, it, expect, vi, afterEach } from 'vitest'
import { withViewTransition } from './viewTransition'

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => unknown
}

describe('withViewTransition', () => {
  const doc = document as DocumentWithViewTransition
  const originalStart = doc.startViewTransition

  afterEach(() => {
    if (originalStart === undefined) {
      Reflect.deleteProperty(doc, 'startViewTransition')
    } else {
      doc.startViewTransition = originalStart
    }
  })

  it('startViewTransition が未対応のとき callback を直接実行する', () => {
    Reflect.deleteProperty(doc, 'startViewTransition')
    const cb = vi.fn()
    withViewTransition(cb)
    expect(cb).toHaveBeenCalledOnce()
  })

  it('startViewTransition が対応のとき そちらに callback を渡す', () => {
    const spy = vi.fn((cb: () => void) => cb())
    Object.defineProperty(doc, 'startViewTransition', {
      value: spy,
      writable: true,
      configurable: true,
    })
    const cb = vi.fn()
    withViewTransition(cb)
    expect(spy).toHaveBeenCalledOnce()
    expect(cb).toHaveBeenCalledOnce()
  })
})
