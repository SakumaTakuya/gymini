import { useCallback, useRef, useState, type PointerEvent } from 'react'
import {
  tactileVibrate,
  HAPTIC_SWIPE_PRE_MS,
  HAPTIC_SWIPE_COMMIT_MS,
} from '@/lib/haptic'

const DEAD_ZONE_PX = 8
const RUBBER_BAND_LIMIT_RATIO = 0.6
const RUBBER_BAND_DAMP = 0.3
const MAX_ROTATION_DEG = 1.5
const DEFAULT_VELOCITY_THRESHOLD = 0.6
const DEFAULT_DISPLACEMENT_RATIO = 0.4

type Options = {
  onCommitLeft?: () => void
  onCommitRight?: () => void
  rowWidthPx: number
  velocityThresholdPxPerMs?: number
  displacementThresholdRatio?: number
}

export type SwipeBinding<T extends HTMLElement> = {
  ref: (el: T | null) => void
  style: { transform: string; transition: string }
  onPointerDown: (e: PointerEvent<T>) => void
  onPointerMove: (e: PointerEvent<T>) => void
  onPointerUp: (e: PointerEvent<T>) => void
  onPointerCancel: (e: PointerEvent<T>) => void
  displacement: number
}

function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function useSwipeGesture<T extends HTMLElement>(opts: Options): SwipeBinding<T> {
  const elRef = useRef<T | null>(null)
  const startRef = useRef<{ x: number; time: number } | null>(null)
  const lastMoveRef = useRef<{ x: number; time: number } | null>(null)
  const velocityRef = useRef(0)
  const preHapticFiredRef = useRef(false)
  const [displacement, setDisplacement] = useState(0)
  const [snapping, setSnapping] = useState(false)

  const velocityThreshold = opts.velocityThresholdPxPerMs ?? DEFAULT_VELOCITY_THRESHOLD
  const displacementThreshold = opts.rowWidthPx * (opts.displacementThresholdRatio ?? DEFAULT_DISPLACEMENT_RATIO)
  const rubberBandLimit = opts.rowWidthPx * RUBBER_BAND_LIMIT_RATIO

  const ref = useCallback((el: T | null) => {
    elRef.current = el
  }, [])

  const onPointerDown = useCallback((e: PointerEvent<T>) => {
    if (e.pointerType !== 'touch') return
    const now = performance.now()
    startRef.current = { x: e.clientX, time: now }
    lastMoveRef.current = { x: e.clientX, time: now }
    velocityRef.current = 0
    preHapticFiredRef.current = false
    setSnapping(false)
  }, [])

  const onPointerMove = useCallback((e: PointerEvent<T>) => {
    const start = startRef.current
    const last = lastMoveRef.current
    if (!start || !last) return

    const dx = e.clientX - start.x
    if (Math.abs(dx) < DEAD_ZONE_PX) {
      setDisplacement(0)
      return
    }

    const effective = dx > 0 ? dx - DEAD_ZONE_PX : dx + DEAD_ZONE_PX
    let next: number
    if (Math.abs(effective) <= rubberBandLimit) {
      next = effective
    } else {
      const sign = effective > 0 ? 1 : -1
      const over = Math.abs(effective) - rubberBandLimit
      next = sign * (rubberBandLimit + over * RUBBER_BAND_DAMP)
    }

    const now = performance.now()
    const dt = now - last.time
    if (dt > 0) {
      velocityRef.current = (e.clientX - last.x) / dt
    }
    lastMoveRef.current = { x: e.clientX, time: now }

    if (!preHapticFiredRef.current && Math.abs(next) >= displacementThreshold) {
      tactileVibrate(HAPTIC_SWIPE_PRE_MS)
      preHapticFiredRef.current = true
    }

    setDisplacement(next)
  }, [rubberBandLimit, displacementThreshold])

  const release = useCallback((e: PointerEvent<T>) => {
    const start = startRef.current
    if (!start) return

    const totalDx = e.clientX - start.x
    const speed = Math.abs(velocityRef.current)
    const overDisplacement = Math.abs(totalDx) >= displacementThreshold
    const overVelocity = speed >= velocityThreshold && Math.abs(totalDx) >= DEAD_ZONE_PX

    if (overDisplacement || overVelocity) {
      tactileVibrate(HAPTIC_SWIPE_COMMIT_MS)
      if (totalDx > 0) opts.onCommitRight?.()
      else opts.onCommitLeft?.()
    }

    startRef.current = null
    lastMoveRef.current = null
    velocityRef.current = 0
    preHapticFiredRef.current = false
    setDisplacement(0)
    setSnapping(true)
  }, [displacementThreshold, velocityThreshold, opts])

  const reducedMotion = isReducedMotion()
  const rotationDeg = reducedMotion
    ? 0
    : (displacement / opts.rowWidthPx) * MAX_ROTATION_DEG

  const transformParts: string[] = []
  if (displacement !== 0) transformParts.push(`translateX(${displacement.toFixed(2)}px)`)
  if (rotationDeg !== 0) transformParts.push(`rotate(${rotationDeg.toFixed(3)}deg)`)
  const transform = transformParts.join(' ')

  const transition = snapping
    ? 'transform var(--duration-normal) var(--ease-snap)'
    : 'none'

  return {
    ref,
    style: { transform, transition },
    onPointerDown,
    onPointerMove,
    onPointerUp: release,
    onPointerCancel: release,
    displacement,
  }
}
