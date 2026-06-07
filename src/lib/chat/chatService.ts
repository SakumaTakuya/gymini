import type { Content } from '@google/generative-ai'
import type { FunctionCallRequest, GeminiClient } from '../geminiClient'
import type { ChatMessage, ToolCallResult } from '../../types/chat'
import type { ToolExecutionResult } from '../toolExecutor'
import { toFunctionResponseObject } from './conversation'
import { partitionFunctionCalls, toProposalMessage } from './pendingAction'

// Outcome of one chat turn (one or two Gemini calls + read-tool execution).
// Pure data — the caller (useChatService) decides how to apply it to the store
// and is the only place that performs write-tool side effects, abort handling,
// and store mutations.
export type TurnOutcome =
  | { kind: 'text'; text: string | null; toolCalls?: ToolCallResult[] }
  | {
      kind: 'write'
      call: FunctionCallRequest
      assistantText: string | null
      precedingReads: ToolCallResult[]
    }
  | {
      kind: 'proposal'
      proposalMsg: ChatMessage
      precedingReads?: ToolCallResult[]
    }

export type RunConversationTurnArgs = {
  baseContents: Content[]
  client: GeminiClient
  executeRead: (
    name: string,
    args: Record<string, unknown>,
  ) => ToolExecutionResult
  signal: AbortSignal
}

export async function runConversationTurn(
  args: RunConversationTurnArgs,
): Promise<TurnOutcome> {
  const { baseContents, client, executeRead, signal } = args

  const first = await client.generate(baseContents, signal)

  if (!first.functionCalls || first.functionCalls.length === 0) {
    return { kind: 'text', text: first.text }
  }

  const { readCalls, writeCall, proposeCall } = partitionFunctionCalls(
    first.functionCalls,
  )
  const readResults: ToolCallResult[] = readCalls.map((fc) => ({
    toolName: fc.name,
    args: fc.args,
    result: executeRead(fc.name, fc.args),
  }))

  if (writeCall) {
    return {
      kind: 'write',
      call: writeCall,
      assistantText: first.text,
      precedingReads: readResults,
    }
  }

  if (proposeCall) {
    const proposalMsg = toProposalMessage(proposeCall)
    if (proposalMsg) {
      return { kind: 'proposal', proposalMsg }
    }
    // proposeCall was malformed (toProposalMessage returned null) — fall through
    // so the user still sees first.text instead of an empty UI.
  }

  // No write/proposal and no reads: nothing to follow up. Surface first.text
  // (or the empty-response fallback) instead of silently dropping the turn.
  if (readCalls.length === 0) return { kind: 'text', text: first.text }

  // Gemini 2.5 系では functionCall に thought_signature が付与されており、
  // フォローアップで再構築するとシグネチャが欠落して 400 になる。
  // SDK が返した modelContent をそのまま送り返す。
  const modelTurn: Content = first.modelContent ?? {
    role: 'model',
    parts: readCalls.map((fc) => ({
      functionCall: { name: fc.name, args: fc.args },
    })),
  }
  const followUpContents: Content[] = [
    ...baseContents,
    modelTurn,
    {
      role: 'user',
      parts: readResults.map((r) => ({
        functionResponse: {
          name: r.toolName,
          response: toFunctionResponseObject(r.result),
        },
      })),
    },
  ]
  const follow = await client.generate(followUpContents, signal)

  const followPartition = follow.functionCalls
    ? partitionFunctionCalls(follow.functionCalls)
    : null

  if (followPartition?.writeCall) {
    return {
      kind: 'write',
      call: followPartition.writeCall,
      assistantText: follow.text,
      precedingReads: readResults,
    }
  }
  if (followPartition?.proposeCall) {
    const proposalMsg = toProposalMessage(followPartition.proposeCall)
    if (proposalMsg) {
      return { kind: 'proposal', proposalMsg, precedingReads: readResults }
    }
  }
  return { kind: 'text', text: follow.text, toolCalls: readResults }
}
