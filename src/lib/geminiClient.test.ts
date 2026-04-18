import { beforeEach, describe, expect, test, vi } from 'vitest'

const generateContentMock = vi.fn()
const getGenerativeModelMock = vi.fn(() => ({ generateContent: generateContentMock }))

vi.mock('@google/generative-ai', async () => {
  const actual = await vi.importActual<typeof import('@google/generative-ai')>(
    '@google/generative-ai',
  )
  return {
    ...actual,
    GoogleGenerativeAI: vi.fn(() => ({
      getGenerativeModel: getGenerativeModelMock,
    })),
  }
})

import {
  createGeminiClient,
  getErrorMessage,
  GEMINI_MODEL,
  MAX_HISTORY_MESSAGES,
} from './geminiClient'

function makeResponse(
  text: string | null,
  functionCalls: Array<{ name: string; args: Record<string, unknown> }> | null = null,
) {
  return {
    response: {
      text: () => text ?? '',
      functionCalls: () => functionCalls,
    },
  }
}

describe('createGeminiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('uses gemini-flash-latest model', () => {
    createGeminiClient({ apiKey: 'key' })
    expect(getGenerativeModelMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: GEMINI_MODEL }),
    )
  })

  test('sendMessage returns text response', async () => {
    generateContentMock.mockResolvedValueOnce(makeResponse('hello'))
    const client = createGeminiClient({ apiKey: 'key' })
    const result = await client.sendMessage([], 'hi')
    expect(result).toEqual({ text: 'hello', functionCalls: null })
  })

  test('sendMessage returns functionCalls', async () => {
    generateContentMock.mockResolvedValueOnce(
      makeResponse('', [{ name: 'getRecentWorkouts', args: { count: 3 } }]),
    )
    const client = createGeminiClient({ apiKey: 'key' })
    const result = await client.sendMessage([], 'show latest')
    expect(result.functionCalls).toEqual([
      { name: 'getRecentWorkouts', args: { count: 3 } },
    ])
  })

  test('sendMessage truncates history to last 50 messages', async () => {
    generateContentMock.mockResolvedValueOnce(makeResponse('ok'))
    const client = createGeminiClient({ apiKey: 'key' })
    const longHistory = Array.from({ length: 80 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('model' as const),
      parts: [{ text: `msg-${i}` }],
    }))
    await client.sendMessage(longHistory, 'now')
    const call = generateContentMock.mock.calls[0][0] as {
      contents: Array<{ role: string; parts: Array<{ text?: string }> }>
    }
    expect(call.contents).toHaveLength(MAX_HISTORY_MESSAGES + 1)
    expect(call.contents[0].parts[0].text).toBe('msg-30')
    expect(call.contents[call.contents.length - 1].parts[0].text).toBe('now')
  })

  test('sendMessage passes abort signal', async () => {
    generateContentMock.mockResolvedValueOnce(makeResponse('ok'))
    const client = createGeminiClient({ apiKey: 'key' })
    const ctrl = new AbortController()
    await client.sendMessage([], 'x', ctrl.signal)
    const opts = generateContentMock.mock.calls[0][1]
    expect(opts).toEqual({ signal: ctrl.signal })
  })

  test('sendFunctionResult sends functionResponse parts', async () => {
    generateContentMock.mockResolvedValueOnce(makeResponse('done'))
    const client = createGeminiClient({ apiKey: 'key' })
    await client.sendFunctionResult([], [
      { name: 'getExercises', response: { list: [] } },
    ])
    const call = generateContentMock.mock.calls[0][0] as {
      contents: Array<{ role: string; parts: Array<{ functionResponse?: { name: string; response: unknown } }> }>
    }
    const lastContent = call.contents[call.contents.length - 1]
    expect(lastContent.role).toBe('user')
    expect(lastContent.parts[0].functionResponse).toEqual({
      name: 'getExercises',
      response: { list: [] },
    })
  })
})

describe('getErrorMessage', () => {
  test('maps API_KEY_INVALID to key error', () => {
    const msg = getErrorMessage(new Error('API_KEY_INVALID: key rejected'))
    expect(msg).toMatch(/APIキー/)
  })

  test('maps 401 to key error', () => {
    const msg = getErrorMessage(new Error('HTTP 401 unauthorized'))
    expect(msg).toMatch(/APIキー/)
  })

  test('maps 429 to rate limit', () => {
    const msg = getErrorMessage(new Error('HTTP 429 too many requests'))
    expect(msg).toMatch(/リクエスト制限/)
  })

  test('maps RATE_LIMIT to rate limit', () => {
    const msg = getErrorMessage(new Error('RATE_LIMIT_EXCEEDED'))
    expect(msg).toMatch(/リクエスト制限/)
  })

  test('maps fetch/network to network error', () => {
    expect(getErrorMessage(new Error('fetch failed'))).toMatch(/ネットワーク/)
    expect(getErrorMessage(new Error('Network request failed'))).toMatch(/ネットワーク/)
  })

  test('defaults to generic error', () => {
    expect(getErrorMessage(new Error('something went wrong'))).toMatch(/予期しない/)
    expect(getErrorMessage('string')).toMatch(/予期しない/)
    expect(getErrorMessage(null)).toMatch(/予期しない/)
  })
})
