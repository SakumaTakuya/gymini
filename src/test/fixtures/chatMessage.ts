import type { ChatMessage } from '../../types/chat'
import type { ISODateTimeString } from '../../schemas/date'

const DEFAULT_TIMESTAMP = '2026-04-18T12:00:00+09:00' as ISODateTimeString

export function makeChatMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: overrides.id ?? 'msg-1',
    role: overrides.role ?? 'user',
    content: overrides.content ?? 'hello',
    timestamp: overrides.timestamp ?? DEFAULT_TIMESTAMP,
    ...overrides,
  }
}
