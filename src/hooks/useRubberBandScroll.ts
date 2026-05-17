import { useCallback, useRef, useState, type PointerEvent } from 'react'
import { tactileVibrate, HAPTIC_SCROLL_EDGE_MS } from '@/lib/haptic'

const RUBBER_BAND_LIMIT_PX = 80
const RUBBER_BAND_DAMP = 0.3
const RUBBER_BAND_DEAD_ZONE_PX = 8

type PointerStart = { y: number; scrollTop: number }

export type RubberBandBinding = {
  ref: (el: HTMLDivElement | null) => void
  style: { transform: string; transition: string }
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => void
  onPointerUp: (e: PointerEvent<HTMLDivElement>) => void
  onPointerCancel: (e: PointerEvent<HTMLDivElement>) => void
}

export function useRubberBandScroll(): RubberBandBinding {
  const elRef = useRef<HTMLDivElement | null>(null)
  const startRef = useRef<PointerStart | null>(null)
  const hapticFiredRef = useRef(false)
  const [translateY, setTranslateY] = useState(0)
  const [active, setActive] = useState(false)

  const ref = useCallback((el: HTMLDivElement | null) => {
    elRef.current = el
  }, [])

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!elRef.current) return
    if (e.pointerType !== 'touch') return
    startRef.current = { y: e.clientY, scrollTop: elRef.current.scrollTop }
    hapticFiredRef.current = false
  }, [])

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const el = elRef.current
    const start = startRef.current
    if (!el || !start) return
    const dy = e.clientY - start.y
    if (Math.abs(dy) < RUBBER_BAND_DEAD_ZONE_PX) return
    const scrollTop = el.scrollTop
    const maxScroll = el.scrollHeight - el.clientHeight

    const atTop = scrollTop <= 0
    const atBottom = scrollTop >= maxScroll - 1

    let next = 0
    if (dy > 0 && atTop) {
      const effective = dy - RUBBER_BAND_DEAD_ZONE_PX
      next = Math.min(effective * RUBBER_BAND_DAMP, RUBBER_BAND_LIMIT_PX)
    } else if (dy < 0 && atBottom) {
      const effective = dy + RUBBER_BAND_DEAD_ZONE_PX
      next = Math.max(effective * RUBBER_BAND_DAMP, -RUBBER_BAND_LIMIT_PX)
    }

    if (next !== 0 && !hapticFiredRef.current) {
      tactileVibrate(HAPTIC_SCROLL_EDGE_MS)
      hapticFiredRef.current = true
    }

    setTranslateY(next)
    setActive(next !== 0)
  }, [])

  const release = useCallback(() => {
    startRef.current = null
    setTranslateY(0)
    setActive(false)
  }, [])

  return {
    ref,
    style: {
      transform: translateY === 0 ? '' : `translateY(${translateY}px)`,
      transition: active ? 'none' : 'transform var(--duration-normal) var(--ease-snap)',
    },
    onPointerDown,
    onPointerMove,
    onPointerUp: release,
    onPointerCancel: release,
  }
}
