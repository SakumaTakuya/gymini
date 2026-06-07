import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useEffect } from 'react'
import { act, render } from '@testing-library/react'
import { useSnapScroll, type UseSnapScrollOptions } from './useSnapScroll'

const VIEWPORT_WIDTH = 100

// jsdom does not compute layout, so clientWidth defaults to 0. Stub the
// prototype so the hook treats the viewport as if it has real width.
let clientWidthDescriptor: PropertyDescriptor | undefined
beforeEach(() => {
  clientWidthDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientWidth',
  )
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() {
      return VIEWPORT_WIDTH
    },
  })
  vi.useFakeTimers()
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0)
    return 0
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  if (clientWidthDescriptor) {
    Object.defineProperty(
      HTMLElement.prototype,
      'clientWidth',
      clientWidthDescriptor,
    )
  } else {
    // @ts-expect-error - restore by deletion if there was no original descriptor
    delete HTMLElement.prototype.clientWidth
  }
})

function Carousel(props: UseSnapScrollOptions & { onScrollLeft?: (n: number) => void }) {
  const ref = useSnapScroll<HTMLDivElement>(props)
  useEffect(() => {
    if (ref.current) props.onScrollLeft?.(ref.current.scrollLeft)
  })
  return (
    <div ref={ref} data-testid="vp">
      <div />
      <div />
      <div />
    </div>
  )
}

describe('useSnapScroll', () => {
  it('マウント時に scrollLeft を centerIndex * clientWidth に合わせる', () => {
    const { getByTestId } = render(
      <Carousel centerIndex={1} recenterKey={'k1'} onCommitIndex={() => {}} />,
    )
    const vp = getByTestId('vp') as HTMLDivElement
    expect(vp.scrollLeft).toBe(VIEWPORT_WIDTH * 1)
  })

  it('recenterKey が変わると再センタリングする', () => {
    const { getByTestId, rerender } = render(
      <Carousel centerIndex={1} recenterKey={'k1'} onCommitIndex={() => {}} />,
    )
    const vp = getByTestId('vp') as HTMLDivElement
    vp.scrollLeft = 0 // ユーザ操作を模擬
    rerender(
      <Carousel centerIndex={1} recenterKey={'k2'} onCommitIndex={() => {}} />,
    )
    expect(vp.scrollLeft).toBe(VIEWPORT_WIDTH * 1)
  })

  it('スクロールが非中心 index に止まると onCommitIndex を呼ぶ', () => {
    const onCommitIndex = vi.fn()
    const { getByTestId } = render(
      <Carousel centerIndex={1} recenterKey={'k1'} onCommitIndex={onCommitIndex} />,
    )
    const vp = getByTestId('vp') as HTMLDivElement
    vp.scrollLeft = VIEWPORT_WIDTH * 2 // next 方向にスナップ
    act(() => {
      vp.dispatchEvent(new Event('scroll'))
      vi.advanceTimersByTime(120)
    })
    expect(onCommitIndex).toHaveBeenCalledWith(2)
  })

  it('中心 index に止まったときは onCommitIndex を呼ばない', () => {
    const onCommitIndex = vi.fn()
    const { getByTestId } = render(
      <Carousel centerIndex={1} recenterKey={'k1'} onCommitIndex={onCommitIndex} />,
    )
    const vp = getByTestId('vp') as HTMLDivElement
    vp.scrollLeft = VIEWPORT_WIDTH * 1 // 中心に留まる
    act(() => {
      vp.dispatchEvent(new Event('scroll'))
      vi.advanceTimersByTime(120)
    })
    expect(onCommitIndex).not.toHaveBeenCalled()
  })

  it('連続スクロールは debounce され最後の位置のみ commit する', () => {
    const onCommitIndex = vi.fn()
    const { getByTestId } = render(
      <Carousel centerIndex={1} recenterKey={'k1'} onCommitIndex={onCommitIndex} />,
    )
    const vp = getByTestId('vp') as HTMLDivElement
    act(() => {
      vp.scrollLeft = VIEWPORT_WIDTH * 0
      vp.dispatchEvent(new Event('scroll'))
      vi.advanceTimersByTime(60)
      vp.scrollLeft = VIEWPORT_WIDTH * 2
      vp.dispatchEvent(new Event('scroll'))
      vi.advanceTimersByTime(120)
    })
    expect(onCommitIndex).toHaveBeenCalledTimes(1)
    expect(onCommitIndex).toHaveBeenCalledWith(2)
  })

  it('onCommitIndex は最新のクロージャ（ref 経由）が使われる', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { getByTestId, rerender } = render(
      <Carousel centerIndex={1} recenterKey={'k1'} onCommitIndex={first} />,
    )
    rerender(
      <Carousel centerIndex={1} recenterKey={'k1'} onCommitIndex={second} />,
    )
    const vp = getByTestId('vp') as HTMLDivElement
    vp.scrollLeft = VIEWPORT_WIDTH * 0
    act(() => {
      vp.dispatchEvent(new Event('scroll'))
      vi.advanceTimersByTime(120)
    })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith(0)
  })

  it('clientWidth が 0 のとき recenter を no-op にする', () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return 0
      },
    })
    const { getByTestId } = render(
      <Carousel centerIndex={1} recenterKey={'k1'} onCommitIndex={() => {}} />,
    )
    const vp = getByTestId('vp') as HTMLDivElement
    expect(vp.scrollLeft).toBe(0)
  })
})
