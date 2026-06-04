import { z } from 'zod'
import type { ChatMessage } from '../types/chat'

const toolCallResultSchema = z.object({
  toolName: z.string(),
  args: z.record(z.string(), z.unknown()),
  result: z.unknown(),
})

const proposedActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(['start-exercise', 'ask-followup', 'show-history']),
  payload: z
    .object({
      exerciseName: z.string().optional(),
      exerciseId: z.string().optional(),
      prompt: z.string().optional(),
    })
    .optional(),
})

export const chatMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.string(),
  toolCalls: z.array(toolCallResultSchema).optional(),
  actions: z.array(proposedActionSchema).optional(),
  consumedActionId: z.string().nullable().optional(),
})

// Validates an unknown value (typically rehydrated from localStorage) into a
// ChatMessage[]; returns [] when the shape is corrupt or incompatible so a bad
// persisted payload can never crash the chat UI.
export function parseStoredMessages(value: unknown): ChatMessage[] {
  const result = z.array(chatMessageSchema).safeParse(value)
  return result.success ? (result.data as ChatMessage[]) : []
}
