// Decouples the session lifecycle from chatStore without a circular import:
// chatStore imports workoutSessionStore (for its partialize check), so
// workoutSessionStore must not import chatStore directly. The session-reset
// signal is published here and chatStore subscribes, keeping the cross-store
// link explicit and typed (replaces the former untyped storeBus singleton).
type Listener = () => void

const resetListeners = new Set<Listener>()

export function onSessionReset(listener: Listener): () => void {
  resetListeners.add(listener)
  return () => {
    resetListeners.delete(listener)
  }
}

export function emitSessionReset(): void {
  for (const listener of resetListeners) listener()
}
