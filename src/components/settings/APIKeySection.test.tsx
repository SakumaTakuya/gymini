import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { APIKeySection } from './APIKeySection'
import { useSettingsStore } from '@/stores/settingsStore'

describe('APIKeySection', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({ apiKey: '', hasApiKey: false })
  })

  it('displays Gemini API section label', () => {
    render(<APIKeySection />)
    expect(screen.getByText('Gemini API')).toBeInTheDocument()
  })

  it('renders input field masked by default', () => {
    render(<APIKeySection />)
    const input = screen.getByLabelText('Gemini APIキー')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('toggles visibility when eye button is clicked', async () => {
    const user = userEvent.setup()
    render(<APIKeySection />)
    const input = screen.getByLabelText('Gemini APIキー')
    const toggle = screen.getByRole('button', { name: 'APIキーを表示' })

    await user.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'APIキーを非表示' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'APIキーを非表示' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('saves key to store on change (onChange 即保存)', async () => {
    const user = userEvent.setup()
    render(<APIKeySection />)
    const input = screen.getByLabelText('Gemini APIキー')

    await user.type(input, 'AIzaSy-new-key')

    expect(useSettingsStore.getState().apiKey).toBe('AIzaSy-new-key')
    expect(useSettingsStore.getState().hasApiKey).toBe(true)
    expect(localStorage.getItem('gymini:api-key')).toBe('AIzaSy-new-key')
  })

  it('shows connected status when key is set', () => {
    useSettingsStore.setState({ apiKey: 'AIzaSy-test', hasApiKey: true })
    render(<APIKeySection />)
    expect(screen.getByText('接続済み')).toBeInTheDocument()
  })

  it('shows not-set status when key is empty', () => {
    render(<APIKeySection />)
    expect(screen.getByText('未設定')).toBeInTheDocument()
  })

  it('hides delete button when key is not set', () => {
    render(<APIKeySection />)
    expect(screen.queryByRole('button', { name: 'APIキーを削除' })).not.toBeInTheDocument()
  })

  it('shows delete button when key is set', () => {
    useSettingsStore.setState({ apiKey: 'AIzaSy-test', hasApiKey: true })
    render(<APIKeySection />)
    expect(screen.getByRole('button', { name: 'APIキーを削除' })).toBeInTheDocument()
  })

  it('deletes key when delete button is clicked', async () => {
    const user = userEvent.setup()
    useSettingsStore.setState({ apiKey: 'AIzaSy-test', hasApiKey: true })
    localStorage.setItem('gymini:api-key', 'AIzaSy-test')

    render(<APIKeySection />)
    await user.click(screen.getByRole('button', { name: 'APIキーを削除' }))

    expect(useSettingsStore.getState().apiKey).toBe('')
    expect(useSettingsStore.getState().hasApiKey).toBe(false)
    expect(localStorage.getItem('gymini:api-key')).toBeNull()
  })

  it('resets input to empty after key is deleted (controlled input)', async () => {
    const user = userEvent.setup()
    useSettingsStore.setState({ apiKey: 'AIzaSy-test', hasApiKey: true })
    render(<APIKeySection />)

    const input = screen.getByLabelText('Gemini APIキー') as HTMLInputElement
    expect(input.value).toBe('AIzaSy-test')

    await user.click(screen.getByRole('button', { name: 'APIキーを削除' }))
    expect(input.value).toBe('')
  })

  it('ensures tap targets have min 44px', () => {
    useSettingsStore.setState({ apiKey: 'AIzaSy-test', hasApiKey: true })
    render(<APIKeySection />)

    const toggle = screen.getByRole('button', { name: 'APIキーを表示' })
    const deleteBtn = screen.getByRole('button', { name: 'APIキーを削除' })

    expect(toggle.className).toContain('min-h-[44px]')
    expect(toggle.className).toContain('min-w-[44px]')
    expect(deleteBtn.className).toContain('min-h-[44px]')
    expect(deleteBtn.className).toContain('min-w-[44px]')
  })
})
