// chatStore ↔ workoutSessionStore 間の循環 import を避けるためのハブ。
// 詳細は docs/adr/ai-chat.md「Store 間の循環 import 回避」を参照。
type StoreBus = {
  clearChatMessages?: () => void
}

export const storeBus: StoreBus = {}
