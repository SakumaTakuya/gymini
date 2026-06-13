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
  buildSystemInstruction,
  createGeminiClient,
  getErrorMessage,
  GEMINI_MODEL,
  GEMINI_TIMEOUT_MS,
  GeminiTimeoutError,
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

  test('gemini-3-flash-preview モデルを使用する', () => {
    createGeminiClient({ apiKey: 'key' })
    expect(getGenerativeModelMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: GEMINI_MODEL }),
    )
  })

  test('config.model を指定するとそのモデルを使用する', () => {
    createGeminiClient({ apiKey: 'key', model: 'gemini-2.5-pro' })
    expect(getGenerativeModelMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-2.5-pro' }),
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

  test('generate が abort シグナルを渡す（タイムアウトと合成され、ユーザーの abort で発火する）', async () => {
    generateContentMock.mockResolvedValueOnce(makeResponse('ok'))
    const client = createGeminiClient({ apiKey: 'key' })
    const ctrl = new AbortController()
    await client.generate(
      [{ role: 'user', parts: [{ text: 'x' }] }],
      ctrl.signal,
    )
    const opts = generateContentMock.mock.calls[0][1] as { signal: AbortSignal }
    expect(opts.signal).toBeInstanceOf(AbortSignal)
    expect(opts.signal.aborted).toBe(false)
    ctrl.abort()
    expect(opts.signal.aborted).toBe(true)
  })

  test('応答がタイムアウトすると GeminiTimeoutError を投げる', async () => {
    vi.useFakeTimers()
    try {
      generateContentMock.mockImplementation(
        (_req: unknown, opts: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            opts.signal.addEventListener('abort', () =>
              reject(new Error('The operation was aborted')),
            )
          }),
      )
      const client = createGeminiClient({ apiKey: 'key' })
      const promise = client.generate([{ role: 'user', parts: [{ text: 'x' }] }])
      const assertion = expect(promise).rejects.toBeInstanceOf(GeminiTimeoutError)
      await vi.advanceTimersByTimeAsync(GEMINI_TIMEOUT_MS)
      await assertion
    } finally {
      vi.useRealTimers()
    }
  })

  test('タイムアウト以外の失敗はそのまま再スローする', async () => {
    const apiError = new Error('500 internal error')
    generateContentMock.mockRejectedValueOnce(apiError)
    const client = createGeminiClient({ apiKey: 'key' })
    await expect(
      client.generate([{ role: 'user', parts: [{ text: 'x' }] }]),
    ).rejects.toBe(apiError)
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

describe('buildSystemInstruction', () => {
  test('プロファイル null・セッション null のときベース指示と日付セクションを含む', () => {
    const result = buildSystemInstruction(null, null)
    expect(result).toContain('AIコーチ')
    expect(result).toContain('今日の日付')
    expect(result).not.toContain('進行中のセッション')
  })

  test('プロファイル無しでもセッション文脈が渡されたら注入する', () => {
    const result = buildSystemInstruction(null, '進行中: ベンチプレス 60kg × 10回')
    expect(result).toContain('進行中のセッション')
    expect(result).toContain('ベンチプレス 60kg × 10回')
  })

  test('プロファイルとセッション両方注入する', () => {
    const result = buildSystemInstruction(
      {
        birthYear: 1990,
        weightKg: 70,
        heightCm: 170,
        trainingGoal: 'muscle_gain',
      },
      '進行中: スクワット 100kg × 5回',
    )
    expect(result).toContain('ユーザープロフィール')
    expect(result).toContain('進行中のセッション')
    expect(result).toContain('スクワット 100kg × 5回')
  })

  test('session が空文字列の場合は注入しない', () => {
    const result = buildSystemInstruction(null, '')
    expect(result).not.toContain('進行中のセッション')
  })

  describe('種目名のみ入力時の placeholder 提案ルール (FR_015)', () => {
    test('SYSTEM_INSTRUCTION に「種目名のみ」「placeholder」相当のルールが含まれる', () => {
      const result = buildSystemInstruction(null, null)
      // FR_015 の要点: 種目名のみのケースでも書き込みツールを呼び出し、placeholder sets で提案する
      expect(result).toMatch(/種目名/)
      expect(result).toMatch(/プレースホルダ|placeholder/)
      // 0/0 の placeholder を使う指示が含まれる
      expect(result).toMatch(/weight.*0|0.*reps|\{\s*weight\s*:\s*0/i)
    })

    test('SYSTEM_INSTRUCTION に「種目名のみ→ツール呼び出し」を明示するキーワードを含む', () => {
      const result = buildSystemInstruction(null, null)
      // セッション分岐の説明
      expect(result).toMatch(/addExerciseToSession/)
      expect(result).toMatch(/saveWorkout/)
      // 「テキストのみで返すな」の禁止
      expect(result).toMatch(/必ず|呼び出し|提案/)
    })

    test('未登録種目フローを addExerciseToSession にも適用する旨を含む', () => {
      const result = buildSystemInstruction(null, null)
      // getExercises → addExercise → 目的のツール の順序
      expect(result).toMatch(/getExercises/)
      expect(result).toMatch(/addExercise/)
    })
  })

  describe('応答モード判定 (FR_037 / Proposed 段階)', () => {
    test('SYSTEM_INSTRUCTION に proposeAction ツールの言及がある', () => {
      const result = buildSystemInstruction(null, null)
      expect(result).toMatch(/proposeAction/)
    })

    test('Conversational / Proposed / Committed の 3 モードが言及される', () => {
      const result = buildSystemInstruction(null, null)
      expect(result).toMatch(/Proposed/i)
      expect(result).toMatch(/Committed/i)
    })

    test('「具体値を含む発話は Committed」の最優先ルールが明示される', () => {
      const result = buildSystemInstruction(null, null)
      // 具体的な kg/回数/セット数が含まれたら無条件で書き込みツールを呼ぶ
      expect(result).toMatch(/具体.*(重量|kg|回数|セット)/)
    })

    test('未決定発話（「何やろう」「○○の日」「メニュー」「おすすめ」）の例示が含まれる', () => {
      const result = buildSystemInstruction(null, null)
      expect(result).toMatch(/何やろう|何やる|メニュー|おすすめ|候補|の日/)
    })
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

  test('GeminiTimeoutError をタイムアウトメッセージにマップする', () => {
    expect(getErrorMessage(new GeminiTimeoutError())).toMatch(/タイムアウト/)
  })
})
