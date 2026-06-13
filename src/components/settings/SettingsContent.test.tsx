import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SettingsContent } from './SettingsContent'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_GEMINI_MODEL } from '@/lib/geminiModels'

function renderContent() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <SettingsContent />
    </QueryClientProvider>,
  )
}

describe('SettingsContent', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({
      apiKey: '',
      hasApiKey: false,
      model: DEFAULT_GEMINI_MODEL,
    })
  })

  it('APIKeySectionを描画する', () => {
    renderContent()
    expect(screen.getByText('Gemini API')).toBeInTheDocument()
  })

  it('ModelSelectSectionを描画する', () => {
    renderContent()
    expect(screen.getByText('Gemini モデル')).toBeInTheDocument()
  })

  it('ExerciseMasterSectionを描画する', () => {
    renderContent()
    expect(screen.getByText('種目マスター')).toBeInTheDocument()
  })
})
