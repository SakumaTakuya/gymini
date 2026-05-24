import { describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useInlineEditField } from './useInlineEditField'

const mapDuplicate = (err: unknown) =>
  err instanceof Error && err.message.startsWith('Duplicate') ? '重複' : null

describe('useInlineEditField', () => {
  it('reset で初期値を設定しエラーをクリアする', () => {
    const { result } = renderHook(() => useInlineEditField(mapDuplicate))
    act(() => result.current.reset('ベンチプレス'))
    expect(result.current.value).toBe('ベンチプレス')
    expect(result.current.error).toBeNull()
  })

  it('setValue は値を更新しエラーをクリアする', () => {
    const { result } = renderHook(() => useInlineEditField(mapDuplicate))
    act(() => {
      result.current.commit(() => {
        throw new Error('Duplicate name: x')
      })
    })
    // commit でエラーが立つ状態を作る前に value を入れておく
    act(() => result.current.setValue('a'))
    expect(result.current.value).toBe('a')
    expect(result.current.error).toBeNull()
  })

  it('commit は save を呼び成功時 true を返す', () => {
    const save = vi.fn()
    const { result } = renderHook(() => useInlineEditField(mapDuplicate))
    act(() => result.current.setValue('  スクワット  '))
    let closed = false
    act(() => {
      closed = result.current.commit(save)
    })
    expect(save).toHaveBeenCalledWith('スクワット')
    expect(closed).toBe(true)
  })

  it('空入力は save を呼ばず true（キャンセル扱い）を返す', () => {
    const save = vi.fn()
    const { result } = renderHook(() => useInlineEditField(mapDuplicate))
    act(() => result.current.setValue('   '))
    let closed = false
    act(() => {
      closed = result.current.commit(save)
    })
    expect(save).not.toHaveBeenCalled()
    expect(closed).toBe(true)
  })

  it('マップ可能なエラーは error を立て false を返す', () => {
    const { result } = renderHook(() => useInlineEditField(mapDuplicate))
    act(() => result.current.setValue('ベンチプレス'))
    let closed = true
    act(() => {
      closed = result.current.commit(() => {
        throw new Error('Duplicate name: ベンチプレス')
      })
    })
    expect(result.current.error).toBe('重複')
    expect(closed).toBe(false)
  })

  it('マップ外のエラーは true（クローズ）を返しエラーを立てない', () => {
    const { result } = renderHook(() => useInlineEditField(mapDuplicate))
    act(() => result.current.setValue('ベンチプレス'))
    let closed = false
    act(() => {
      closed = result.current.commit(() => {
        throw new Error('Something else')
      })
    })
    expect(result.current.error).toBeNull()
    expect(closed).toBe(true)
  })
})
