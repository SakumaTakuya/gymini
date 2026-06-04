import type { StateStorage } from 'zustand/middleware'

export type StorageErrorReason = 'quota' | 'unavailable'

let currentError: StorageErrorReason | null = null
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

export function getStorageError(): StorageErrorReason | null {
  return currentError
}

export function subscribeStorageError(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function clearStorageError(): void {
  if (currentError !== null) {
    currentError = null
    emit()
  }
}

function setStorageError(reason: StorageErrorReason): void {
  if (currentError !== reason) {
    currentError = reason
    emit()
  }
}

function isQuotaExceeded(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22)
  )
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

// Returns false when the write fails. On failure the cause is recorded in the
// storage-error signal so the UI can warn the user (T-002); on success any prior
// error is cleared since persistence is working again.
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    clearStorageError()
    return true
  } catch (error) {
    setStorageError(isQuotaExceeded(error) ? 'quota' : 'unavailable')
    return false
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Removal failures are non-fatal and intentionally ignored.
  }
}

// Storage adapter for zustand persist so its writes share the same quota
// detection and error signal as the manual repositories/stores.
export const safeStateStorage: StateStorage = {
  getItem: (key) => safeGetItem(key),
  setItem: (key, value) => {
    safeSetItem(key, value)
  },
  removeItem: (key) => {
    safeRemoveItem(key)
  },
}
