import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAutoSaveField } from './useAutoSaveField'

describe('useAutoSaveField', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('scheduleSave で saving → (debounce) saved → (hold) idle と遷移し save を呼ぶ', () => {
    const save = vi.fn()
    const { result } = renderHook(() => useAutoSaveField())

    act(() => result.current.scheduleSave(save))
    expect(result.current.saveStatus).toBe('saving')
    expect(save).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(300))
    expect(save).toHaveBeenCalledTimes(1)
    expect(result.current.saveStatus).toBe('saved')

    act(() => vi.advanceTimersByTime(1500))
    expect(result.current.saveStatus).toBe('idle')
  })

  it('連続呼び出しは debounce され最後の save のみ実行する', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { result } = renderHook(() => useAutoSaveField())

    act(() => result.current.scheduleSave(first))
    act(() => vi.advanceTimersByTime(100))
    act(() => result.current.scheduleSave(second))
    act(() => vi.advanceTimersByTime(300))

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('cancel で保留中の save を中止し idle に戻す', () => {
    const save = vi.fn()
    const { result } = renderHook(() => useAutoSaveField())

    act(() => result.current.scheduleSave(save))
    act(() => result.current.cancel())
    act(() => vi.advanceTimersByTime(300))

    expect(save).not.toHaveBeenCalled()
    expect(result.current.saveStatus).toBe('idle')
  })

  it('saved ホールド中の cancel も idle に戻す', () => {
    const save = vi.fn()
    const { result } = renderHook(() => useAutoSaveField())

    act(() => result.current.scheduleSave(save))
    act(() => vi.advanceTimersByTime(300))
    expect(result.current.saveStatus).toBe('saved')

    act(() => result.current.cancel())
    expect(result.current.saveStatus).toBe('idle')
  })

  it('unmount 時に保留タイマーをクリアする（save は呼ばれない）', () => {
    const save = vi.fn()
    const { result, unmount } = renderHook(() => useAutoSaveField())

    act(() => result.current.scheduleSave(save))
    unmount()
    act(() => vi.advanceTimersByTime(300))

    expect(save).not.toHaveBeenCalled()
  })
})
