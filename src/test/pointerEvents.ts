import { act } from '@testing-library/react'

type PointerEventOpts = {
  clientX?: number
  clientY?: number
  pointerType?: 'touch' | 'mouse' | 'pen'
  timeStamp?: number
}

export function firePointer(
  el: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  opts: PointerEventOpts = {},
): void {
  const ev = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    ...(opts.clientX !== undefined ? { clientX: opts.clientX } : {}),
    ...(opts.clientY !== undefined ? { clientY: opts.clientY } : {}),
  })
  Object.defineProperty(ev, 'pointerType', {
    value: opts.pointerType ?? 'touch',
    configurable: true,
  })
  if (opts.timeStamp !== undefined) {
    Object.defineProperty(ev, 'timeStamp', { value: opts.timeStamp, configurable: true })
  }
  act(() => { el.dispatchEvent(ev) })
}
