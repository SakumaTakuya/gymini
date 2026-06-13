import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UseQueryResult } from '@tanstack/react-query'
import { ModelSelectSection } from './ModelSelectSection'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_GEMINI_MODEL, type GeminiModelInfo } from '@/lib/geminiModels'
import * as UseGeminiModels from '@/hooks/useGeminiModels'

type ModelsQuery = UseQueryResult<GeminiModelInfo[], Error>

function mockQuery(partial: Partial<ModelsQuery>) {
  vi.spyOn(UseGeminiModels, 'useGeminiModels').mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    ...partial,
  } as ModelsQuery)
}

describe('ModelSelectSection', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({
      apiKey: '',
      hasApiKey: false,
      model: DEFAULT_GEMINI_MODEL,
    })
    vi.restoreAllMocks()
  })

  it('APIキー未設定のときは案内文を表示し select を出さない', () => {
    useSettingsStore.setState({ hasApiKey: false })
    mockQuery({})

    render(<ModelSelectSection />)

    expect(screen.getByText(/APIキーを設定/)).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('取得中はローディング文言を表示する', () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    mockQuery({ isLoading: true })

    render(<ModelSelectSection />)

    expect(screen.getByText(/取得中/)).toBeInTheDocument()
  })

  it('取得失敗時はエラー文言を表示する', () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    mockQuery({ isError: true })

    render(<ModelSelectSection />)

    expect(screen.getByText(/取得できませんでした/)).toBeInTheDocument()
  })

  it('取得成功時にモデルの option を表示する', () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    mockQuery({
      data: [
        { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' },
        { id: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' },
      ],
    })

    render(<ModelSelectSection />)

    expect(
      screen.getByRole('option', { name: 'Gemini 2.5 Pro' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'Gemini 2.5 Flash' }),
    ).toBeInTheDocument()
  })

  it('option を選ぶと setModel が呼ばれ選択が保存される', async () => {
    const user = userEvent.setup()
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    mockQuery({
      data: [
        { id: 'gemini-3-flash-preview', displayName: 'Gemini 3 Flash Preview' },
        { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' },
      ],
    })

    render(<ModelSelectSection />)
    await user.selectOptions(screen.getByRole('combobox'), 'gemini-2.5-pro')

    expect(useSettingsStore.getState().model).toBe('gemini-2.5-pro')
  })

  it('現在選択中のモデルが一覧に無くても option として表示する', () => {
    useSettingsStore.setState({
      apiKey: 'k',
      hasApiKey: true,
      model: 'gemini-private-preview',
    })
    mockQuery({
      data: [{ id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' }],
    })

    render(<ModelSelectSection />)

    expect(
      screen.getByRole('option', { name: /gemini-private-preview/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('gemini-private-preview')
  })
})
