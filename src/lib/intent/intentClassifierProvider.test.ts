import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { IntentClassifier } from './intentClassifier'

const createLocalIntentClassifierMock = vi.fn()
vi.mock('./transformersEmbedder', () => ({
  createLocalIntentClassifier: (...args: unknown[]) =>
    createLocalIntentClassifierMock(...args),
}))

import {
  ensureIntentClassifierReady,
  getReadyIntentClassifier,
  resetIntentClassifierProviderForTests,
  warmUpIntentClassifier,
} from './intentClassifierProvider'

function stubClassifier(readyResult: boolean): IntentClassifier {
  return {
    ready: vi.fn(async () => readyResult),
    classify: vi.fn(async () => ({
      scores: { record: 1, history: 0, advice: 0, edit: 0, other: 0 },
      decided: ['record' as const],
      candidates: [],
    })),
  }
}

describe('intentClassifierProvider', () => {
  beforeEach(() => {
    resetIntentClassifierProviderForTests()
    createLocalIntentClassifierMock.mockReset()
    // warmUp はテスト環境では no-op のため、本番相当に切り替えて検証する
    vi.stubEnv('MODE', 'production')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    resetIntentClassifierProviderForTests()
  })

  it('warmUp 前は null を返す', () => {
    expect(getReadyIntentClassifier()).toBeNull()
  })

  it('warmUp で読み込みが成功すると分類器を返す', async () => {
    const classifier = stubClassifier(true)
    createLocalIntentClassifierMock.mockResolvedValue(classifier)
    warmUpIntentClassifier()
    await vi.waitFor(() => {
      expect(getReadyIntentClassifier()).toBe(classifier)
    })
  })

  it('warmUp は一度だけ読み込みを開始する', async () => {
    createLocalIntentClassifierMock.mockResolvedValue(stubClassifier(true))
    warmUpIntentClassifier()
    warmUpIntentClassifier()
    await vi.waitFor(() => {
      expect(getReadyIntentClassifier()).not.toBeNull()
    })
    expect(createLocalIntentClassifierMock).toHaveBeenCalledTimes(1)
  })

  it('分類器の生成に失敗しても例外を投げず null のままになる', async () => {
    createLocalIntentClassifierMock.mockRejectedValue(new Error('fetch failed'))
    warmUpIntentClassifier()
    await new Promise((r) => setTimeout(r, 10))
    expect(getReadyIntentClassifier()).toBeNull()
  })

  it('ready() が false なら null のままになる', async () => {
    createLocalIntentClassifierMock.mockResolvedValue(stubClassifier(false))
    warmUpIntentClassifier()
    await new Promise((r) => setTimeout(r, 10))
    expect(getReadyIntentClassifier()).toBeNull()
  })

  it('ensureIntentClassifierReady は読み込み完了を待って分類器を返す', async () => {
    let resolveLoad: (c: IntentClassifier) => void = () => {}
    createLocalIntentClassifierMock.mockReturnValue(
      new Promise<IntentClassifier>((r) => {
        resolveLoad = r
      }),
    )
    const classifier = stubClassifier(true)
    let settled = false
    const pending = ensureIntentClassifierReady().then((c) => {
      settled = true
      return c
    })
    await new Promise((r) => setTimeout(r, 10))
    expect(settled).toBe(false)
    resolveLoad(classifier)
    await expect(pending).resolves.toBe(classifier)
    expect(getReadyIntentClassifier()).toBe(classifier)
  })

  it('ensureIntentClassifierReady は読み込み失敗時に null を返す', async () => {
    createLocalIntentClassifierMock.mockRejectedValue(new Error('fetch failed'))
    await expect(ensureIntentClassifierReady()).resolves.toBeNull()
  })

  it('ensureIntentClassifierReady はテスト環境では読み込みを開始せず null を返す', async () => {
    vi.stubEnv('MODE', 'test')
    await expect(ensureIntentClassifierReady()).resolves.toBeNull()
    expect(createLocalIntentClassifierMock).not.toHaveBeenCalled()
  })

  it('テスト環境（MODE=test）では warmUp が読み込みを開始しない', async () => {
    vi.stubEnv('MODE', 'test')
    createLocalIntentClassifierMock.mockResolvedValue(stubClassifier(true))
    warmUpIntentClassifier()
    await new Promise((r) => setTimeout(r, 10))
    expect(createLocalIntentClassifierMock).not.toHaveBeenCalled()
    expect(getReadyIntentClassifier()).toBeNull()
  })
})
