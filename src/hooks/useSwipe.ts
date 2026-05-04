import { useRef } from 'react'
import type { TouchEvent as ReactTouchEvent } from 'react'

export interface SwipeCallbacks {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onDragChange?: (dragX: number) => void
  onDragEnd?: () => void
}

export interface SwipeOptions {
  threshold?: number
  verticalLimit?: number
}

interface SwipeState {
  startX: number
  startY: number
  currentX: number
  cancelled: boolean
  active: boolean
}

const DEFAULT_THRESHOLD = 50
const DEFAULT_VERTICAL_LIMIT = 60

export function useSwipe(
  callbacks: SwipeCallbacks,
  options: SwipeOptions = {},
) {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD
  const verticalLimit = options.verticalLimit ?? DEFAULT_VERTICAL_LIMIT

  const stateRef = useRef<SwipeState | null>(null)

  const onTouchStart = (e: ReactTouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    stateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      cancelled: false,
      active: true,
    }
  }

  const onTouchMove = (e: ReactTouchEvent) => {
    const state = stateRef.current
    if (!state || !state.active) return
    const touch = e.touches[0]
    if (!touch) return

    const deltaY = touch.clientY - state.startY
    if (Math.abs(deltaY) > verticalLimit) {
      if (!state.cancelled) {
        state.cancelled = true
        callbacks.onDragChange?.(0)
      }
      return
    }

    if (state.cancelled) return

    state.currentX = touch.clientX
    const deltaX = state.currentX - state.startX
    callbacks.onDragChange?.(deltaX)
  }

  const onTouchEnd = (_e: ReactTouchEvent) => {
    const state = stateRef.current
    if (!state || !state.active) {
      callbacks.onDragEnd?.()
      return
    }

    const deltaX = state.currentX - state.startX
    state.active = false

    if (!state.cancelled) {
      if (deltaX <= -threshold) {
        callbacks.onSwipeLeft?.()
      } else if (deltaX >= threshold) {
        callbacks.onSwipeRight?.()
      }
    }
    callbacks.onDragEnd?.()
  }

  return { onTouchStart, onTouchMove, onTouchEnd }
}
