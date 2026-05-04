import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { useSwipe } from './useSwipe'

interface HarnessProps {
  callbacks: Parameters<typeof useSwipe>[0]
  options?: Parameters<typeof useSwipe>[1]
}

function Harness({ callbacks, options }: HarnessProps) {
  const handlers = useSwipe(callbacks, options)
  return createElement('div', {
    'data-testid': 'swipe-target',
    style: { width: 300, height: 200 },
    ...handlers,
  })
}

function renderHarness(props: HarnessProps) {
  const utils = render(createElement(Harness, props))
  const target = utils.getByTestId('swipe-target')
  return { ...utils, target }
}

function touchEvent(x: number, y: number) {
  return {
    touches: [{ clientX: x, clientY: y }],
    changedTouches: [{ clientX: x, clientY: y }],
  }
}

describe('useSwipe', () => {
  it('閾値を超える左ドラッグで onSwipeLeft + onDragEnd が呼ばれる', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const onDragEnd = vi.fn()
    const { target } = renderHarness({
      callbacks: { onSwipeLeft, onSwipeRight, onDragEnd },
    })

    fireEvent.touchStart(target, touchEvent(200, 100))
    fireEvent.touchMove(target, touchEvent(100, 100))
    fireEvent.touchEnd(target, touchEvent(100, 100))

    expect(onSwipeLeft).toHaveBeenCalledOnce()
    expect(onSwipeRight).not.toHaveBeenCalled()
    expect(onDragEnd).toHaveBeenCalledOnce()
  })

  it('閾値を超える右ドラッグで onSwipeRight + onDragEnd が呼ばれる', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const onDragEnd = vi.fn()
    const { target } = renderHarness({
      callbacks: { onSwipeLeft, onSwipeRight, onDragEnd },
    })

    fireEvent.touchStart(target, touchEvent(50, 100))
    fireEvent.touchMove(target, touchEvent(150, 100))
    fireEvent.touchEnd(target, touchEvent(150, 100))

    expect(onSwipeRight).toHaveBeenCalledOnce()
    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onDragEnd).toHaveBeenCalledOnce()
  })

  it('閾値未満では方向コールバックは呼ばれず onDragEnd のみ', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const onDragEnd = vi.fn()
    const { target } = renderHarness({
      callbacks: { onSwipeLeft, onSwipeRight, onDragEnd },
      options: { threshold: 50 },
    })

    fireEvent.touchStart(target, touchEvent(100, 100))
    fireEvent.touchMove(target, touchEvent(120, 100))
    fireEvent.touchEnd(target, touchEvent(120, 100))

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
    expect(onDragEnd).toHaveBeenCalledOnce()
  })

  it('縦移動が verticalLimit を超えた場合は方向コールバックを呼ばない', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const onDragChange = vi.fn()
    const onDragEnd = vi.fn()
    const { target } = renderHarness({
      callbacks: { onSwipeLeft, onSwipeRight, onDragChange, onDragEnd },
      options: { threshold: 50, verticalLimit: 30 },
    })

    fireEvent.touchStart(target, touchEvent(200, 100))
    // 縦に大きく移動 → 破棄
    fireEvent.touchMove(target, touchEvent(200, 150))
    // その後横に大きく移動しても無効
    fireEvent.touchMove(target, touchEvent(50, 150))
    fireEvent.touchEnd(target, touchEvent(50, 150))

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
    expect(onDragEnd).toHaveBeenCalledOnce()
  })

  it('onDragChange が touchmove ごとに最新 deltaX を受け取る', () => {
    const onDragChange = vi.fn()
    const { target } = renderHarness({
      callbacks: { onDragChange },
    })

    fireEvent.touchStart(target, touchEvent(200, 100))
    fireEvent.touchMove(target, touchEvent(180, 100))
    fireEvent.touchMove(target, touchEvent(150, 100))

    expect(onDragChange).toHaveBeenCalledWith(-20)
    expect(onDragChange).toHaveBeenLastCalledWith(-50)
  })

  it('onSwipeLeft 未指定でも右スワイプで例外にならない', () => {
    const onSwipeRight = vi.fn()
    const { target } = renderHarness({
      callbacks: { onSwipeRight },
    })

    fireEvent.touchStart(target, touchEvent(50, 100))
    fireEvent.touchMove(target, touchEvent(150, 100))
    fireEvent.touchEnd(target, touchEvent(150, 100))

    expect(onSwipeRight).toHaveBeenCalledOnce()
  })

  it('touchStart せずに touchEnd だけ来てもクラッシュしない', () => {
    const onDragEnd = vi.fn()
    const { target } = renderHarness({
      callbacks: { onDragEnd },
    })

    expect(() =>
      fireEvent.touchEnd(target, touchEvent(100, 100)),
    ).not.toThrow()
  })
})
