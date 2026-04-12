import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { APIKeySection } from './APIKeySection'
import { useSettingsStore } from '@/stores/settingsStore'

describe('APIKeySection', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettingsStore.setState({ apiKey: '', hasApiKey: false })
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it('saves key to store after 300ms debounce', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<APIKeySection />)
    const input = screen.getByLabelText('Gemini APIキー')

    await user.type(input, 'AIzaSy-new-key')

    // debounce 前: store には反映されていない
    expect(useSettingsStore.getState().apiKey).toBe('')
    expect(localStorage.getItem('gymini:api-key')).toBeNull()

    // 300ms 経過で保存確定
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(useSettingsStore.getState().apiKey).toBe('AIzaSy-new-key')
    expect(useSettingsStore.getState().hasApiKey).toBe(true)
    expect(localStorage.getItem('gymini:api-key')).toBe('AIzaSy-new-key')
  })

  it('debounces consecutive input so only the last value is persisted', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    render(<APIKeySection />)
    const input = screen.getByLabelText('Gemini APIキー')

    await user.type(input, 'abc')
    await user.type(input, 'def')

    // 最後の入力から 300ms 経過するまで書き込みは発生しない
    expect(setItemSpy).not.toHaveBeenCalledWith('gymini:api-key', expect.any(String))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    const apiKeyCalls = setItemSpy.mock.calls.filter(([k]) => k === 'gymini:api-key')
    expect(apiKeyCalls).toHaveLength(1)
    expect(apiKeyCalls[0][1]).toBe('abcdef')
    expect(useSettingsStore.getState().apiKey).toBe('abcdef')
  })

  it('displays "保存中…" while debounce is pending', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<APIKeySection />)
    const input = screen.getByLabelText('Gemini APIキー')

    await user.type(input, 'a')

    expect(screen.getByText('保存中…')).toBeInTheDocument()
  })

  it('displays "保存済み" after debounce fires', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<APIKeySection />)
    const input = screen.getByLabelText('Gemini APIキー')

    await user.type(input, 'a')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(screen.getByText('保存済み')).toBeInTheDocument()
  })

  it('does not write to localStorage when unmounted before debounce fires', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const { unmount } = render(<APIKeySection />)
    const input = screen.getByLabelText('Gemini APIキー')

    await user.type(input, 'abc')
    unmount()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    const apiKeyCalls = setItemSpy.mock.calls.filter(([k]) => k === 'gymini:api-key')
    expect(apiKeyCalls).toHaveLength(0)
    expect(useSettingsStore.getState().apiKey).toBe('')
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

    // 目アイコンボタンは入力の zinc-100 ピル（h-11=44px）内に配置され、
    // before:absolute before:inset-[-10px] で擬似要素によるクリック領域拡張を行う
    const toggle = screen.getByRole('button', { name: 'APIキーを表示' })
    expect(toggle.className).toContain('before:absolute')
    expect(toggle.className).toMatch(/before:inset-\[-?\d+px\]/)

    // 削除はテキストボタンで、before:inset-[-10px] で外側にクリック領域を拡張
    const deleteBtn = screen.getByRole('button', { name: 'APIキーを削除' })
    expect(deleteBtn.className).toContain('before:absolute')
    expect(deleteBtn.className).toMatch(/before:inset-\[-?\d+px\]/)
  })
})
