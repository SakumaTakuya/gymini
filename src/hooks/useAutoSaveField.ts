import { useCallback, useEffect, useRef, useState } from 'react'

const DEBOUNCE_MS = 300
const SAVED_HOLD_MS = 1500

export type SaveStatus = 'idle' | 'saving' | 'saved'

type AutoSaveOptions = {
  debounceMs?: number
  savedHoldMs?: number
}

// Debounced auto-save with a transient "saving"→"saved"→"idle" status, shared by
// the settings sections (API key / profile) so the timer bookkeeping lives in one
// place instead of being duplicated per component.
export function useAutoSaveField(options: AutoSaveOptions = {}) {
  const debounceMs = options.debounceMs ?? DEBOUNCE_MS
  const savedHoldMs = options.savedHoldMs ?? SAVED_HOLD_MS

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (savedTimerRef.current !== null) {
      clearTimeout(savedTimerRef.current)
      savedTimerRef.current = null
    }
  }, [])

  // Clear any pending timer on unmount to avoid setting state after teardown.
  useEffect(() => clearTimers, [clearTimers])

  const scheduleSave = useCallback(
    (save: () => void) => {
      setSaveStatus('saving')
      clearTimers()
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null
        save()
        setSaveStatus('saved')
        savedTimerRef.current = setTimeout(() => {
          savedTimerRef.current = null
          setSaveStatus('idle')
        }, savedHoldMs)
      }, debounceMs)
    },
    [clearTimers, debounceMs, savedHoldMs],
  )

  const cancel = useCallback(() => {
    clearTimers()
    setSaveStatus('idle')
  }, [clearTimers])

  return { saveStatus, scheduleSave, cancel }
}
