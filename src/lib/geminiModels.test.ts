import { afterEach, describe, expect, test, vi } from 'vitest'
import { DEFAULT_GEMINI_MODEL, fetchAvailableModels } from './geminiModels'

function mockFetch(payload: unknown, ok = true, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    status,
    json: async () => payload,
  } as Response)
}

describe('DEFAULT_GEMINI_MODEL', () => {
  test('既定モデルは gemini-3-flash-preview', () => {
    expect(DEFAULT_GEMINI_MODEL).toBe('gemini-3-flash-preview')
  })
})

describe('fetchAvailableModels', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('generateContent をサポートするモデルだけを返し、models/ 接頭辞を除去する', async () => {
    mockFetch({
      models: [
        {
          name: 'models/gemini-3-flash-preview',
          displayName: 'Gemini 3 Flash Preview',
          supportedGenerationMethods: ['generateContent', 'countTokens'],
        },
        {
          name: 'models/text-embedding-004',
          displayName: 'Embedding 004',
          supportedGenerationMethods: ['embedContent'],
        },
        {
          name: 'models/gemini-2.5-pro',
          displayName: 'Gemini 2.5 Pro',
          supportedGenerationMethods: ['generateContent'],
        },
      ],
    })

    const models = await fetchAvailableModels('key')

    expect(models).toEqual([
      { id: 'gemini-3-flash-preview', displayName: 'Gemini 3 Flash Preview' },
      { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' },
    ])
  })

  test('displayName が無いときは id をフォールバック表示名に使う', async () => {
    mockFetch({
      models: [
        {
          name: 'models/gemini-x',
          supportedGenerationMethods: ['generateContent'],
        },
      ],
    })

    const models = await fetchAvailableModels('key')

    expect(models).toEqual([{ id: 'gemini-x', displayName: 'gemini-x' }])
  })

  test('APIキーを query パラメータに付けて ListModels を呼び出す', async () => {
    const spy = mockFetch({ models: [] })

    await fetchAvailableModels('secret-key')

    const url = spy.mock.calls[0][0] as string
    expect(url).toContain('/v1beta/models')
    expect(url).toContain('key=secret-key')
  })

  test('abort シグナルを fetch に渡す', async () => {
    const spy = mockFetch({ models: [] })
    const ctrl = new AbortController()

    await fetchAvailableModels('key', ctrl.signal)

    const init = spy.mock.calls[0][1] as { signal?: AbortSignal } | undefined
    expect(init?.signal).toBe(ctrl.signal)
  })

  test('レスポンスが ok でないときエラーを投げる', async () => {
    mockFetch({ error: { message: 'invalid key' } }, false, 403)

    await expect(fetchAvailableModels('key')).rejects.toThrow(/403/)
  })

  test('models フィールドが無いときは空配列を返す', async () => {
    mockFetch({})

    expect(await fetchAvailableModels('key')).toEqual([])
  })
})
