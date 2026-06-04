import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { ApiKeyMissingBanner } from './ApiKeyMissingBanner'
import { useSettingsStore } from '@/stores/settingsStore'
import { renderWithRouter } from '@/test/router-utils'

describe('ApiKeyMissingBanner', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({ apiKey: '', hasApiKey: false })
  })

  it('hasApiKey が false のとき警告と設定リンクを表示する', async () => {
    renderWithRouter(<ApiKeyMissingBanner />)
    expect(await screen.findByText('APIキーが必要です')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /設定画面へ/ }),
    ).toHaveAttribute('href', expect.stringContaining('/settings'))
  })

  it('hasApiKey が true のとき何も表示しない', () => {
    useSettingsStore.setState({ apiKey: 'key', hasApiKey: true })
    const { container } = renderWithRouter(<ApiKeyMissingBanner />)
    expect(container.querySelector('p')).toBeNull()
  })
})
