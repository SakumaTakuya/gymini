import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useGeminiModels } from './useGeminiModels'
import { useSettingsStore } from '@/stores/settingsStore'
import * as GeminiModels from '@/lib/geminiModels'

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
}

describe('useGeminiModels', () => {
  beforeEach(() => {
    useSettingsStore.setState({ apiKey: '', hasApiKey: false })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('APIキー未設定のときは取得せず data が undefined のまま', async () => {
    const spy = vi.spyOn(GeminiModels, 'fetchAvailableModels')

    const { result } = renderHook(() => useGeminiModels(), {
      wrapper: wrapper(),
    })

    expect(spy).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })

  test('APIキーが設定されているとモデル一覧を取得する', async () => {
    useSettingsStore.setState({ apiKey: 'a-key', hasApiKey: true })
    const spy = vi
      .spyOn(GeminiModels, 'fetchAvailableModels')
      .mockResolvedValue([{ id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' }])

    const { result } = renderHook(() => useGeminiModels(), {
      wrapper: wrapper(),
    })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(spy).toHaveBeenCalledWith('a-key', expect.anything())
    expect(result.current.data).toEqual([
      { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' },
    ])
  })
})
