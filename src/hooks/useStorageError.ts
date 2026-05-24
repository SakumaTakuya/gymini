import { useSyncExternalStore } from 'react'
import {
  getStorageError,
  subscribeStorageError,
  type StorageErrorReason,
} from '../lib/storage'

export function useStorageError(): StorageErrorReason | null {
  return useSyncExternalStore(
    subscribeStorageError,
    getStorageError,
    getStorageError,
  )
}
