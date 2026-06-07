import { describe, it, expect, vi } from 'vitest'
import type { Content } from '@google/generative-ai'
import type {
  FunctionCallRequest,
  GeminiChatResponse,
  GeminiClient,
} from '../geminiClient'
import type { ToolExecutionResult } from '../toolExecutor'
import { runConversationTurn } from './chatService'

function makeResponse(overrides: Partial<GeminiChatResponse> = {}): GeminiChatResponse {
  return {
    text: null,
    functionCalls: null,
    modelContent: null,
    ...overrides,
  }
}

function makeClient(responses: GeminiChatResponse[]): GeminiClient {
  const generate = vi.fn<GeminiClient['generate']>()
  for (const r of responses) generate.mockResolvedValueOnce(r)
  return { generate }
}

const baseContents: Content[] = [
  { role: 'user', parts: [{ text: 'hi' }] },
]

const passingRead = (): ToolExecutionResult => ({ success: true, data: [] })
const neverRead = vi.fn<(name: string, args: Record<string, unknown>) => ToolExecutionResult>()

describe('runConversationTurn', () => {
  it('functionCalls が無いときテキスト結果を返す', async () => {
    const client = makeClient([makeResponse({ text: 'hello' })])
    const result = await runConversationTurn({
      baseContents,
      client,
      executeRead: neverRead,
      signal: new AbortController().signal,
    })
    expect(result).toEqual({ kind: 'text', text: 'hello' })
    expect(neverRead).not.toHaveBeenCalled()
  })

  it('write call が含まれるとき kind:write を返し follow-up は行わない', async () => {
    const writeCall: FunctionCallRequest = {
      name: 'addExerciseToSession',
      args: { exerciseName: 'ベンチプレス' },
    }
    const client = makeClient([
      makeResponse({ text: 'やります', functionCalls: [writeCall] }),
    ])
    const result = await runConversationTurn({
      baseContents,
      client,
      executeRead: passingRead,
      signal: new AbortController().signal,
    })
    expect(result).toMatchObject({
      kind: 'write',
      call: writeCall,
      assistantText: 'やります',
      precedingReads: [],
    })
    expect(client.generate).toHaveBeenCalledTimes(1)
  })

  it('proposeAction が含まれるとき kind:proposal を返す', async () => {
    const proposeCall: FunctionCallRequest = {
      name: 'proposeAction',
      args: {
        rationale: '候補です',
        options: [
          { id: 'a', label: 'ベンチプレス', kind: 'start-exercise', payload: { exerciseName: 'ベンチプレス' } },
        ],
      },
    }
    const client = makeClient([makeResponse({ functionCalls: [proposeCall] })])
    const result = await runConversationTurn({
      baseContents,
      client,
      executeRead: neverRead,
      signal: new AbortController().signal,
    })
    expect(result.kind).toBe('proposal')
    if (result.kind !== 'proposal') return
    expect(result.proposalMsg.role).toBe('assistant')
    expect(result.proposalMsg.actions).toHaveLength(1)
    expect(result.precedingReads).toBeUndefined()
  })

  it('read call のみ → follow-up を1回行い、テキストと toolCalls を返す', async () => {
    const readCall: FunctionCallRequest = {
      name: 'getRecentWorkouts',
      args: { count: 3 },
    }
    const executeRead = vi.fn((): ToolExecutionResult => ({
      success: true,
      data: [{ id: 'w1' }],
    }))
    const modelContent: Content = { role: 'model', parts: [{ functionCall: { name: readCall.name, args: readCall.args } }] }
    const client = makeClient([
      makeResponse({ functionCalls: [readCall], modelContent }),
      makeResponse({ text: '先週は2回でした' }),
    ])
    const result = await runConversationTurn({
      baseContents,
      client,
      executeRead,
      signal: new AbortController().signal,
    })
    expect(executeRead).toHaveBeenCalledWith('getRecentWorkouts', { count: 3 })
    expect(result.kind).toBe('text')
    if (result.kind !== 'text') return
    expect(result.text).toBe('先週は2回でした')
    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls?.[0].toolName).toBe('getRecentWorkouts')
  })

  it('follow-up が write を返したら kind:write + precedingReads を返す', async () => {
    const readCall: FunctionCallRequest = { name: 'getExercises', args: {} }
    const writeCall: FunctionCallRequest = {
      name: 'addExerciseToSession',
      args: { exerciseId: 'ex-1', exerciseName: 'ベンチプレス' },
    }
    const client = makeClient([
      makeResponse({ functionCalls: [readCall] }),
      makeResponse({ functionCalls: [writeCall], text: '追加します' }),
    ])
    const result = await runConversationTurn({
      baseContents,
      client,
      executeRead: () => ({ success: true, data: [] }),
      signal: new AbortController().signal,
    })
    expect(result.kind).toBe('write')
    if (result.kind !== 'write') return
    expect(result.call).toBe(writeCall)
    expect(result.assistantText).toBe('追加します')
    expect(result.precedingReads).toHaveLength(1)
  })

  it('follow-up が proposal を返したら kind:proposal + precedingReads を返す', async () => {
    const readCall: FunctionCallRequest = { name: 'getExercises', args: {} }
    const proposeCall: FunctionCallRequest = {
      name: 'proposeAction',
      args: {
        rationale: '候補です',
        options: [{ id: 'a', label: 'ベンチプレス', kind: 'start-exercise', payload: { exerciseName: 'ベンチプレス' } }],
      },
    }
    const client = makeClient([
      makeResponse({ functionCalls: [readCall] }),
      makeResponse({ functionCalls: [proposeCall] }),
    ])
    const result = await runConversationTurn({
      baseContents,
      client,
      executeRead: () => ({ success: true, data: [] }),
      signal: new AbortController().signal,
    })
    expect(result.kind).toBe('proposal')
    if (result.kind !== 'proposal') return
    expect(result.precedingReads).toHaveLength(1)
  })

  it('propose call の msg が null かつ readCalls が空のとき first.text にフォールバックする（無音化しない）', async () => {
    const proposeCall: FunctionCallRequest = {
      name: 'proposeAction',
      args: { rationale: '', options: [] },
    }
    const client = makeClient([
      makeResponse({ text: '何にする？', functionCalls: [proposeCall] }),
    ])
    const result = await runConversationTurn({
      baseContents,
      client,
      executeRead: neverRead,
      signal: new AbortController().signal,
    })
    expect(result).toEqual({ kind: 'text', text: '何にする？' })
  })

  it('シグナルを Gemini クライアントに渡す', async () => {
    const client = makeClient([makeResponse({ text: 'ok' })])
    const ctrl = new AbortController()
    await runConversationTurn({
      baseContents,
      client,
      executeRead: neverRead,
      signal: ctrl.signal,
    })
    expect(client.generate).toHaveBeenCalledWith(baseContents, ctrl.signal)
  })
})
