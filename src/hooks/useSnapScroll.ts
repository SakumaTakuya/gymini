import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from 'react'

export type UseSnapScrollOptions = {
  /** Snap index that should always be visible (e.g. 1 for a 3-panel carousel). */
  centerIndex: number
  /**
   * Stable primitive value; whenever it changes, the viewport silently re-centers
   * to `centerIndex`. The synthetic scroll write is suppressed so it does not
   * fire `onCommitIndex` itself.
   */
  recenterKey: unknown
  /**
   * Fired after the scroll settles on an index other than `centerIndex`. The
   * caller is expected to advance state so `recenterKey` changes, which silently
   * re-centers the viewport on the new value.
   */
  onCommitIndex: (index: number) => void
  /** Debounce delay before reading the settled index. */
  debounceMs?: number
}

/**
 * Snap-scroll carousel controller. Pins scrollLeft to `centerIndex * clientWidth`
 * on mount, on each `recenterKey` change, and on viewport resize; detects when
 * the user scrolls and the snap lands on a different index (then calls
 * `onCommitIndex`). The `onCommitIndex` closure is stabilised via a ref so the
 * scroll listener is attached once per `centerIndex`/`debounceMs` change rather
 * than on every render.
 */
export function useSnapScroll<T extends HTMLElement>(
  options: UseSnapScrollOptions,
): RefObject<T | null> {
  const { centerIndex, recenterKey, onCommitIndex, debounceMs = 120 } = options

  const ref = useRef<T | null>(null)
  const suppressRef = useRef(false)
  const debounceTimerRef = useRef<number | null>(null)

  const onCommitRef = useRef(onCommitIndex)
  useEffect(() => {
    onCommitRef.current = onCommitIndex
  }, [onCommitIndex])

  // Pin scrollLeft to the center panel. The suppress flag prevents the
  // programmatic scroll from re-triggering the commit listener.
  const recenter = useCallback(() => {
    const v = ref.current
    if (!v) return
    const w = v.clientWidth
    if (w === 0) return
    suppressRef.current = true
    v.scrollLeft = w * centerIndex
    // Double rAF: wait until the browser has emitted the synthetic scroll
    // before re-enabling commit detection.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        suppressRef.current = false
      }),
    )
  }, [centerIndex])

  useLayoutEffect(() => {
    recenter()
  }, [recenterKey, recenter])

  useEffect(() => {
    const v = ref.current
    if (!v || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(recenter)
    ro.observe(v)
    return () => ro.disconnect()
  }, [recenter])

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const commit = () => {
      if (suppressRef.current) return
      const w = v.clientWidth
      if (w === 0) return
      const idx = Math.round(v.scrollLeft / w)
      if (idx !== centerIndex) onCommitRef.current(idx)
    }
    const onScroll = () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = window.setTimeout(commit, debounceMs)
    }
    v.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      v.removeEventListener('scroll', onScroll)
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [centerIndex, debounceMs])

  return ref
}
