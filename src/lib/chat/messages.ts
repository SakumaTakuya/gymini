import type { ChatMessage, ToolCallResult } from '../../types/chat'
import { nowISODateTimeString } from '../../schemas/date'

// Centralised constructor for assistant ChatMessages so the id / role /
// timestamp boilerplate is not duplicated across the orchestrator hook and the
// proposed-action handlers. toolCalls is only attached when provided so the
// stored shape matches the pre-extraction behaviour.
export function buildAssistantMessage(
  content: string,
  toolCalls?: ToolCallResult[],
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content,
    timestamp: nowISODateTimeString(),
    ...(toolCalls ? { toolCalls } : {}),
  }
}
