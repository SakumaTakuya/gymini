import { describe, it, expect, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { useSwipeGesture } from './useSwipeGesture'
import { setupHapticMocks } from '@/test/hapticMocks'
import { firePointer } from '@/test/pointerEvents'

const ROW_WIDTH = 300

let mockNow = 0

function fireSwipe(
  el: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  opts: { clientX?: number; timeStamp?: number; pointerType?: 'touch' | 'mouse' | 'pen' } = {},
) {
  if (opts.timeStamp !== undefined) mockNow = opts.timeStamp
  firePointer(el, type, opts)
}

function Harness({
  rowWidthPx = ROW_WIDTH,
  onCommitLeft,
  onCommitRight,
}: {
  rowWidthPx?: number
  onCommitLeft?: () => void
  onCommitRight?: () => void
}) {
  const {
    ref: swipeRef,
    style: swipeStyle,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    displacement,
  } = useSwipeGesture({ rowWidthPx, onCommitLeft, onCommitRight })
  return (
    <div
      data-testid="sw"
      ref={swipeRef}
      style={{ ...swipeStyle, width: rowWidthPx }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      data-displacement={displacement}
    >
      content
    </div>
  )
}

describe('useSwipeGesture', () => {
  let restore: () => void = () => {}
  vi.spyOn(performance, 'now').mockImplementation(() => mockNow)
  afterEach(() => { restore(); mockNow = 0 })

  describe('発動条件', () => {
    it('pointerType=mouse では発動しない', () => {
      ;({ restore } = setupHapticMocks())
      const { getByTestId } = render(<Harness />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 100, timeStamp: 0, pointerType: 'mouse' })
      fireSwipe(el, 'pointermove', { clientX: 200, timeStamp: 100, pointerType: 'mouse' })
      expect(el.style.transform).toBe('')
    })

    it('|dx| < 8px (デッドゾーン) では translate が乗らない', () => {
      ;({ restore } = setupHapticMocks())
      const { getByTestId } = render(<Harness />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 100, timeStamp: 0 })
      fireSwipe(el, 'pointermove', { clientX: 105, timeStamp: 50 })
      expect(el.style.transform).toBe('')
    })
  })

  describe('変位の追跡', () => {
    it('右 swipe で正の translateX', () => {
      ;({ restore } = setupHapticMocks())
      const { getByTestId } = render(<Harness />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 100, timeStamp: 0 })
      fireSwipe(el, 'pointermove', { clientX: 150, timeStamp: 100 })
      expect(el.style.transform).toMatch(/translateX\((\d+(\.\d+)?)px\)/)
    })

    it('左 swipe で負の translateX', () => {
      ;({ restore } = setupHapticMocks())
      const { getByTestId } = render(<Harness />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 200, timeStamp: 0 })
      fireSwipe(el, 'pointermove', { clientX: 150, timeStamp: 100 })
      expect(el.style.transform).toMatch(/translateX\(-\d+(\.\d+)?px\)/)
    })

    it('rotation も displacement に比例して付与される (最大 1.5deg)', () => {
      ;({ restore } = setupHapticMocks())
      const { getByTestId } = render(<Harness />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 100, timeStamp: 0 })
      // 50% 変位 → 0.75deg 程度
      fireSwipe(el, 'pointermove', { clientX: 250, timeStamp: 100 })
      expect(el.style.transform).toMatch(/rotate\(\d+\.\d+deg\)/)
    })

    it('displacement 値が return される (parent から bg layer 制御に使う)', () => {
      ;({ restore } = setupHapticMocks())
      const { getByTestId } = render(<Harness />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 100, timeStamp: 0 })
      fireSwipe(el, 'pointermove', { clientX: 150, timeStamp: 100 })
      expect(Number(el.getAttribute('data-displacement') ?? 0)).toBeGreaterThan(0)
    })
  })

  describe('rubber-band', () => {
    it('limit 超過 (60% over) で減衰する', () => {
      ;({ restore } = setupHapticMocks())
      const { getByTestId } = render(<Harness />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 0, timeStamp: 0 })
      // dx=400 (rowWidth=300, limit=180), 過剰 220px
      fireSwipe(el, 'pointermove', { clientX: 400, timeStamp: 100 })
      const m = el.style.transform.match(/translateX\((\d+(?:\.\d+)?)px\)/)
      const v = m ? Number(m[1]) : 0
      // limit 180 + 220 * 0.3 = 246 程度に減衰
      expect(v).toBeGreaterThan(180)
      expect(v).toBeLessThan(280)
    })
  })

  describe('commit 判定 (位置 OR 速度)', () => {
    it('displacement が 40% を超えてリリース → onCommitRight 呼ぶ', () => {
      const onCommitRight = vi.fn()
      ;({ restore } = setupHapticMocks())
      const { getByTestId } = render(<Harness onCommitRight={onCommitRight} />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 0, timeStamp: 0 })
      fireSwipe(el, 'pointermove', { clientX: 200, timeStamp: 100 }) // 200 > 300*0.4=120
      fireSwipe(el, 'pointerup', { clientX: 200, timeStamp: 110 })
      expect(onCommitRight).toHaveBeenCalledOnce()
    })

    it('displacement が 40% 未満でも 速度 > 0.6 px/ms → コミット', () => {
      const onCommitRight = vi.fn()
      ;({ restore } = setupHapticMocks())
      const { getByTestId } = render(<Harness onCommitRight={onCommitRight} />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 0, timeStamp: 0 })
      // dx=50, 速度=50/10=5 px/ms (高速 fling)
      fireSwipe(el, 'pointermove', { clientX: 50, timeStamp: 10 })
      fireSwipe(el, 'pointerup', { clientX: 50, timeStamp: 11 })
      expect(onCommitRight).toHaveBeenCalledOnce()
    })

    it('左 swipe で onCommitLeft 呼ぶ', () => {
      const onCommitLeft = vi.fn()
      ;({ restore } = setupHapticMocks())
      const { getByTestId } = render(<Harness onCommitLeft={onCommitLeft} />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 300, timeStamp: 0 })
      fireSwipe(el, 'pointermove', { clientX: 100, timeStamp: 100 }) // dx=-200
      fireSwipe(el, 'pointerup', { clientX: 100, timeStamp: 110 })
      expect(onCommitLeft).toHaveBeenCalledOnce()
    })

    it('閾値未満でリリース → コミットしない (snap-back)', () => {
      const onCommitLeft = vi.fn()
      const onCommitRight = vi.fn()
      ;({ restore } = setupHapticMocks())
      const { getByTestId } = render(<Harness onCommitLeft={onCommitLeft} onCommitRight={onCommitRight} />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 100, timeStamp: 0 })
      fireSwipe(el, 'pointermove', { clientX: 150, timeStamp: 500 }) // 速度=0.1, 変位=50<120
      fireSwipe(el, 'pointerup', { clientX: 150, timeStamp: 510 })
      expect(onCommitLeft).not.toHaveBeenCalled()
      expect(onCommitRight).not.toHaveBeenCalled()
      expect(el.style.transform).toBe('')
    })
  })

  describe('haptic', () => {
    it('displacement 閾値を超えた瞬間に pre-haptic vibrate(8) を 1 回', () => {
      ;({ restore } = setupHapticMocks())
      const { getByTestId } = render(<Harness />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 0, timeStamp: 0 })
      fireSwipe(el, 'pointermove', { clientX: 50, timeStamp: 50 }) // 50 < 120 (40%)
      expect(navigator.vibrate).not.toHaveBeenCalled()
      fireSwipe(el, 'pointermove', { clientX: 150, timeStamp: 100 }) // 150 > 120
      expect(navigator.vibrate).toHaveBeenCalledWith(8)
    })

    it('commit 成立時に vibrate(12)', () => {
      ;({ restore } = setupHapticMocks())
      const { getByTestId } = render(<Harness onCommitRight={vi.fn()} />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 0, timeStamp: 0 })
      fireSwipe(el, 'pointermove', { clientX: 200, timeStamp: 100 })
      fireSwipe(el, 'pointerup', { clientX: 200, timeStamp: 110 })
      expect(navigator.vibrate).toHaveBeenCalledWith(12)
    })

    it('snap-back (閾値未満リリース) では vibrate(12) を呼ばない', () => {
      ;({ restore } = setupHapticMocks())
      const { getByTestId } = render(<Harness onCommitRight={vi.fn()} />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 100, timeStamp: 0 })
      fireSwipe(el, 'pointermove', { clientX: 150, timeStamp: 500 })
      fireSwipe(el, 'pointerup', { clientX: 150, timeStamp: 510 })
      // vibrate(12) は呼ばれない (pre-haptic も呼ばれない)
      expect(navigator.vibrate).not.toHaveBeenCalledWith(12)
    })

    it('prefers-reduced-motion: reduce で vibrate は呼ばれない', () => {
      ;({ restore } = setupHapticMocks({ reducedMotion: true }))
      const { getByTestId } = render(<Harness onCommitRight={vi.fn()} />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 0, timeStamp: 0 })
      fireSwipe(el, 'pointermove', { clientX: 200, timeStamp: 100 })
      fireSwipe(el, 'pointerup', { clientX: 200, timeStamp: 110 })
      expect(navigator.vibrate).not.toHaveBeenCalled()
    })
  })

  describe('reduced motion', () => {
    it('rotation を 0 にする', () => {
      ;({ restore } = setupHapticMocks({ reducedMotion: true }))
      const { getByTestId } = render(<Harness />)
      const el = getByTestId('sw')
      fireSwipe(el, 'pointerdown', { clientX: 100, timeStamp: 0 })
      fireSwipe(el, 'pointermove', { clientX: 250, timeStamp: 100 })
      // translate は乗るが rotate(0deg) になる
      expect(el.style.transform).toMatch(/translateX\(\d+(\.\d+)?px\)/)
      expect(el.style.transform).not.toMatch(/rotate\(\d+\.\d+deg\)/)
    })
  })
})
