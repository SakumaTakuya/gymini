// chatStore と workoutSessionStore の循環 import を避けるための関数登録ハブ。
type StoreBus = {
  clearChatMessages?: () => void
}

export const storeBus: StoreBus = {}
