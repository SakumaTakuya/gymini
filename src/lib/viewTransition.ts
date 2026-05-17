type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => unknown
}

export function withViewTransition(callback: () => void): void {
  if (typeof document === 'undefined') {
    callback()
    return
  }
  const doc = document as DocumentWithViewTransition
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(callback)
    return
  }
  callback()
}
