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
  const parts: Array<Record<string, unknown>> = []
  if (text) parts.push({ text })
  if (functionCalls) {
    for (const fc of functionCalls) {
      parts.push({ functionCall: { ...fc, thoughtSignature: 'sig-stub' } })
    }
  }
  return {
    response: {
      text: () => text ?? '',
      functionCalls: () => functionCalls,
      candidates: [{ content: { role: 'model', parts } }],
    },
  }
}

describe('createGeminiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('gemini-flash-latest モデルを使用する', () => {
    createGeminiClient({ apiKey: 'key' })
    expect(getGenerativeModelMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: GEMINI_MODEL }),
    )
  })

  test('generate がテキストレスポンスを返す', async () => {
    generateContentMock.mockResolvedValueOnce(makeResponse('hello'))
    const client = createGeminiClient({ apiKey: 'key' })
    const result = await client.generate([
      { role: 'user', parts: [{ text: 'hi' }] },
    ])
    expect(result.text).toBe('hello')
    expect(result.functionCalls).toBeNull()
    expect(result.modelContent).toEqual({
      role: 'model',
      parts: [{ text: 'hello' }],
    })
  })

  test('generate が thought signature を保持した生のモデルコンテンツを公開する', async () => {
    generateContentMock.mockResolvedValueOnce(
      makeResponse(null, [{ name: 'getRecentWorkouts', args: { count: 3 } }]),
    )
    const client = createGeminiClient({ apiKey: 'key' })
    const result = await client.generate([
      { role: 'user', parts: [{ text: 'show' }] },
    ])
    expect(result.modelContent?.role).toBe('model')
    const fcPart = result.modelContent?.parts.find(
      (p) => 'functionCall' in p && p.functionCall !== undefined,
    ) as { functionCall: { thoughtSignature?: string } } | undefined
    expect(fcPart?.functionCall.thoughtSignature).toBe('sig-stub')
  })

  test('generate が functionCalls を返す', async () => {
    generateContentMock.mockResolvedValueOnce(
      makeResponse('', [{ name: 'getRecentWorkouts', args: { count: 3 } }]),
    )
    const client = createGeminiClient({ apiKey: 'key' })
    const result = await client.generate([
      { role: 'user', parts: [{ text: 'show latest' }] },
    ])
    expect(result.functionCalls).toEqual([
      { name: 'getRecentWorkouts', args: { count: 3 } },
    ])
  })

  test('generate がコンテンツを最新 50 件に切り詰める', async () => {
    generateContentMock.mockResolvedValueOnce(makeResponse('ok'))
    const client = createGeminiClient({ apiKey: 'key' })
    const longHistory = Array.from({ length: 80 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('model' as const),
      parts: [{ text: `msg-${i}` }],
    }))
    await client.generate(longHistory)
    const call = generateContentMock.mock.calls[0][0] as {
      contents: Array<{ role: string; parts: Array<{ text?: string }> }>
    }
    expect(call.contents).toHaveLength(MAX_HISTORY_MESSAGES)
    expect(call.contents[0].parts[0].text).toBe('msg-30')
    expect(call.contents[call.contents.length - 1].parts[0].text).toBe('msg-79')
  })

  test('generate が abort シグナルを渡す', async () => {
    generateContentMock.mockResolvedValueOnce(makeResponse('ok'))
    const client = createGeminiClient({ apiKey: 'key' })
    const ctrl = new AbortController()
    await client.generate(
      [{ role: 'user', parts: [{ text: 'x' }] }],
      ctrl.signal,
    )
    const opts = generateContentMock.mock.calls[0][1]
    expect(opts).toEqual({ signal: ctrl.signal })
  })

  test('レスポンスがスローしたとき generate が null テキストを返す', async () => {
    generateContentMock.mockResolvedValueOnce({
      response: {
        text: () => {
          throw new Error('no text')
        },
        functionCalls: () => null,
        candidates: [],
      },
    })
    const client = createGeminiClient({ apiKey: 'key' })
    const result = await client.generate([
      { role: 'user', parts: [{ text: 'x' }] },
    ])
    expect(result.text).toBeNull()
    expect(result.modelContent).toBeNull()
  })
})

describe('getErrorMessage', () => {
  test('API_KEY_INVALID をキーエラーにマップする', () => {
    const msg = getErrorMessage(new Error('API_KEY_INVALID: key rejected'))
    expect(msg).toMatch(/APIキー/)
  })

  test('単独の 401 をキーエラーにマップする', () => {
    const msg = getErrorMessage(new Error('HTTP 401 unauthorized'))
    expect(msg).toMatch(/APIキー/)
  })

  test('4011 を 401 として誤分類しない', () => {
    const msg = getErrorMessage(new Error('error code 4011 something'))
    expect(msg).not.toMatch(/APIキー/)
  })

  test('UNAUTHENTICATED をキーエラーにマップする', () => {
    const msg = getErrorMessage(new Error('UNAUTHENTICATED'))
    expect(msg).toMatch(/APIキー/)
  })

  test('429 をレート制限にマップする', () => {
    const msg = getErrorMessage(new Error('HTTP 429 too many requests'))
    expect(msg).toMatch(/リクエスト制限/)
  })

  test('RATE_LIMIT / RESOURCE_EXHAUSTED をレート制限にマップする', () => {
    expect(getErrorMessage(new Error('RATE_LIMIT_EXCEEDED'))).toMatch(/リクエスト制限/)
    expect(getErrorMessage(new Error('RESOURCE_EXHAUSTED quota hit'))).toMatch(
      /リクエスト制限/,
    )
  })

  test('SAFETY フィルターのブロックをマップする', () => {
    expect(getErrorMessage(new Error('Response was blocked: SAFETY'))).toMatch(
      /安全フィルター/,
    )
  })

  test('400 / INVALID_ARGUMENT を不正リクエストのガイダンスにマップする', () => {
    expect(getErrorMessage(new Error('HTTP 400 INVALID_ARGUMENT'))).toMatch(
      /会話をクリア/,
    )
    expect(
      getErrorMessage(new Error('Server returned INVALID_ARGUMENT')),
    ).toMatch(/会話をクリア/)
  })

  test('fetch/ネットワークをネットワークエラーにマップする', () => {
    expect(getErrorMessage(new Error('fetch failed'))).toMatch(/ネットワーク/)
    expect(getErrorMessage(new Error('Network request failed'))).toMatch(/ネットワーク/)
  })

  test('汎用エラーにデフォルトする', () => {
    expect(getErrorMessage(new Error('something went wrong'))).toMatch(/予期しない/)
    expect(getErrorMessage('string')).toMatch(/予期しない/)
    expect(getErrorMessage(null)).toMatch(/予期しない/)
  })
})
