import { describe, it, expect, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { useRubberBandScroll } from './useRubberBandScroll'
import { setupHapticMocks } from '@/test/hapticMocks'

function firePointer(el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup', clientY?: number) {
  const ev = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    ...(clientY !== undefined ? { clientY } : {}),
  })
  Object.defineProperty(ev, 'pointerType', { value: 'touch', configurable: true })
  act(() => { el.dispatchEvent(ev) })
}

function Harness({ scrollTop = 0, atBottom = false }: { scrollTop?: number; atBottom?: boolean }) {
  const binding = useRubberBandScroll()
  const setupEl = (el: HTMLDivElement | null) => {
    binding.ref(el)
    if (el) {
      Object.defineProperty(el, 'scrollTop', { get: () => scrollTop, configurable: true })
      Object.defineProperty(el, 'scrollHeight', { get: () => (atBottom ? 200 : 1000), configurable: true })
      Object.defineProperty(el, 'clientHeight', { get: () => 200, configurable: true })
    }
  }
  return (
    <div
      data-testid="rb"
      ref={setupEl}
      style={{ ...binding.style, height: 200, overflow: 'auto' }}
      onPointerDown={binding.onPointerDown}
      onPointerMove={binding.onPointerMove}
      onPointerUp={binding.onPointerUp}
      onPointerCancel={binding.onPointerCancel}
    >
      content
    </div>
  )
}

describe('useRubberBandScroll', () => {
  let restore: () => void = () => {}
  afterEach(() => { restore() })

  it('scrollTop=0 で下方向プルすると正の translateY が style に乗る (上端ラバーバンド)', () => {
    ;({ restore } = setupHapticMocks())
    const { getByTestId } = render(<Harness scrollTop={0} />)
    const el = getByTestId('rb')
    firePointer(el, 'pointerdown', 100)
    firePointer(el, 'pointermove', 200)
    expect(el.style.transform).toMatch(/translateY\(\d+(\.\d+)?px\)/)
  })

  it('ラバーバンドは limit (80px) を超えない', () => {
    ;({ restore } = setupHapticMocks())
    const { getByTestId } = render(<Harness scrollTop={0} />)
    const el = getByTestId('rb')
    firePointer(el, 'pointerdown', 100)
    firePointer(el, 'pointermove', 1000)
    const m = el.style.transform.match(/translateY\((\d+(?:\.\d+)?)px\)/)
    const value = m ? Number(m[1]) : 0
    expect(value).toBeGreaterThan(0)
    expect(value).toBeLessThanOrEqual(80)
  })

  it('pointerUp で translateY が 0 に戻る', () => {
    ;({ restore } = setupHapticMocks())
    const { getByTestId } = render(<Harness scrollTop={0} />)
    const el = getByTestId('rb')
    firePointer(el, 'pointerdown', 100)
    firePointer(el, 'pointermove', 200)
    firePointer(el, 'pointerup')
    expect(el.style.transform).toBe('')
  })

  it('端到達時に navigator.vibrate(5) を 1 回だけ呼ぶ', () => {
    ;({ restore } = setupHapticMocks())
    const { getByTestId } = render(<Harness scrollTop={0} />)
    const el = getByTestId('rb')
    firePointer(el, 'pointerdown', 100)
    firePointer(el, 'pointermove', 200)
    firePointer(el, 'pointermove', 250)
    expect(navigator.vibrate).toHaveBeenCalledWith(5)
    expect(navigator.vibrate).toHaveBeenCalledTimes(1)
  })

  it('中間スクロール位置では下方向プルしても translateY が動かない', () => {
    ;({ restore } = setupHapticMocks())
    const { getByTestId } = render(<Harness scrollTop={300} />)
    const el = getByTestId('rb')
    firePointer(el, 'pointerdown', 100)
    firePointer(el, 'pointermove', 200)
    expect(el.style.transform).toBe('')
  })

  it('下端で上方向プルすると負の translateY が style に乗る', () => {
    ;({ restore } = setupHapticMocks())
    const { getByTestId } = render(<Harness scrollTop={0} atBottom={true} />)
    const el = getByTestId('rb')
    firePointer(el, 'pointerdown', 200)
    firePointer(el, 'pointermove', 100)
    expect(el.style.transform).toMatch(/translateY\(-\d+(\.\d+)?px\)/)
  })

  it('prefers-reduced-motion: reduce の時は vibrate を呼ばない (translate は動く)', () => {
    ;({ restore } = setupHapticMocks({ reducedMotion: true }))
    const { getByTestId } = render(<Harness scrollTop={0} />)
    const el = getByTestId('rb')
    firePointer(el, 'pointerdown', 100)
    firePointer(el, 'pointermove', 200)
    expect(navigator.vibrate).not.toHaveBeenCalled()
  })

  it('マウス操作 (pointerType=mouse) ではラバーバンドが発動しない (touch 専用)', () => {
    ;({ restore } = setupHapticMocks())
    const { getByTestId } = render(<Harness scrollTop={0} />)
    const el = getByTestId('rb')
    const downEv = new MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientY: 100 })
    Object.defineProperty(downEv, 'pointerType', { value: 'mouse', configurable: true })
    act(() => { el.dispatchEvent(downEv) })
    firePointer(el, 'pointermove', 300)
    expect(el.style.transform).toBe('')
  })

  it('デッドゾーン (8px) 以内の小さな動きでは発動しない', () => {
    ;({ restore } = setupHapticMocks())
    const { getByTestId } = render(<Harness scrollTop={0} />)
    const el = getByTestId('rb')
    firePointer(el, 'pointerdown', 100)
    firePointer(el, 'pointermove', 105) // dy=5, デッドゾーン以内
    expect(el.style.transform).toBe('')
    expect(navigator.vibrate).not.toHaveBeenCalled()
  })
})
