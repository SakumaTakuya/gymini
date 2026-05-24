import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'
import { clearStorageError } from '../lib/storage'

// Stub window.scrollTo for jsdom (TanStack Router scroll restoration)
window.scrollTo = () => {}

// The storage-error signal is module-level global state; reset it between tests
// so a write-failure simulated in one test cannot leak into another.
beforeEach(() => {
  clearStorageError()
})
