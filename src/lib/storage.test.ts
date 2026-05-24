import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  getStorageError,
  clearStorageError,
  subscribeStorageError,
} from './storage'

describe('lib/storage', () => {
  beforeEach(() => {
    localStorage.clear()
    clearStorageError()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('safeGetItem', () => {
    it('値を読み出す', () => {
      localStorage.setItem('k', 'v')
      expect(safeGetItem('k')).toBe('v')
    })

    it('getItem がスローしたとき null を返す', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('boom')
      })
      expect(safeGetItem('k')).toBeNull()
    })
  })

  describe('safeSetItem', () => {
    it('成功時に true を返し永続化する', () => {
      expect(safeSetItem('k', 'v')).toBe(true)
      expect(localStorage.getItem('k')).toBe('v')
    })

    it('QuotaExceededError を quota エラーとして記録し false を返す', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('full', 'QuotaExceededError')
      })
      expect(safeSetItem('k', 'v')).toBe(false)
      expect(getStorageError()).toBe('quota')
    })

    it('その他の失敗は unavailable として記録する', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('disabled')
      })
      expect(safeSetItem('k', 'v')).toBe(false)
      expect(getStorageError()).toBe('unavailable')
    })

    it('成功時に既存のエラーをクリアする', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new DOMException('full', 'QuotaExceededError')
      })
      safeSetItem('k', 'v')
      expect(getStorageError()).toBe('quota')
      safeSetItem('k', 'v')
      expect(getStorageError()).toBeNull()
    })
  })

  describe('safeRemoveItem', () => {
    it('値を削除する', () => {
      localStorage.setItem('k', 'v')
      safeRemoveItem('k')
      expect(localStorage.getItem('k')).toBeNull()
    })

    it('removeItem がスローしても例外を投げない', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('boom')
      })
      expect(() => safeRemoveItem('k')).not.toThrow()
    })
  })

  describe('subscribeStorageError', () => {
    it('エラー発生・クリアでリスナーに通知する', () => {
      const listener = vi.fn()
      const unsubscribe = subscribeStorageError(listener)
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new DOMException('full', 'QuotaExceededError')
      })
      safeSetItem('k', 'v')
      expect(listener).toHaveBeenCalledTimes(1)
      clearStorageError()
      expect(listener).toHaveBeenCalledTimes(2)
      unsubscribe()
      clearStorageError()
      expect(listener).toHaveBeenCalledTimes(2)
    })
  })
})
