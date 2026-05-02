import type { AnchorHTMLAttributes, PropsWithChildren, ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>(
      '@tanstack/react-router',
    )
  return {
    ...actual,
    Link: ({
      children,
      to,
      ...rest
    }: PropsWithChildren<{ to: string; children?: ReactNode } & Record<string, unknown>>) => {
      const { activeProps: _a, inactiveProps: _i, ...domProps } = rest as {
        activeProps?: unknown
        inactiveProps?: unknown
      } & Record<string, unknown>
      void _a
      void _i
      return (
        <a href={to} {...(domProps as AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {children}
        </a>
      )
    },
  }
})

import { AIChatPage } from './AIChatPage'
import { AppHeaderProvider } from '../components/AppHeaderContext'
import { useChatStore } from '../stores/chatStore'
import { useSettingsStore } from '../stores/settingsStore'

function renderAIChatPage() {
  return render(
    <AppHeaderProvider>
      <AIChatPage />
    </AppHeaderProvider>,
  )
}

describe('AIChatPage', () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [], isLoading: false, error: null })
    useSettingsStore.setState({ apiKey: '', hasApiKey: false })
  })

  test('shows API key guidance when key is missing', () => {
    renderAIChatPage()
    expect(screen.getByText('APIキーが必要です')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /設定画面へ/ })).toBeInTheDocument()
  })

  test('renders gear link to settings', () => {
    renderAIChatPage()
    const settingsLink = screen
      .getAllByRole('link')
      .find((l) => l.getAttribute('href') === '/settings')
    expect(settingsLink).toBeDefined()
  })

  test('enables input when key is set', () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    renderAIChatPage()
    expect(screen.queryByText('APIキーが必要です')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('メッセージを入力')).not.toBeDisabled()
  })

  test('shows empty state message when no messages', () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    renderAIChatPage()
    expect(
      screen.getByText('AI コーチとチャットを始めましょう'),
    ).toBeInTheDocument()
  })

  test('renders user and assistant messages', () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useChatStore.setState({
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'やあ',
          timestamp: '2026-04-18T12:00:00+09:00' as never,
        },
        {
          id: '2',
          role: 'assistant',
          content: 'こんにちは！',
          timestamp: '2026-04-18T12:00:01+09:00' as never,
        },
      ],
      isLoading: false,
      error: null,
    })
    renderAIChatPage()
    expect(screen.getByText('やあ')).toBeInTheDocument()
    expect(screen.getByText('こんにちは！')).toBeInTheDocument()
  })

  test('renders confirmation bubble for pending action', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useChatStore.setState({
      messages: [
        {
          id: 'm1',
          role: 'assistant',
          content: '追加しますか？',
          timestamp: '2026-04-18T12:00:00+09:00' as never,
          pendingAction: {
            id: 'pa',
            type: 'addExercise',
            description: '追加しますか？',
            data: { actionType: 'addExercise', name: 'ベンチプレス' },
            status: 'pending',
          },
        },
      ],
      isLoading: false,
      error: null,
    })
    renderAIChatPage()
    expect(screen.getByRole('button', { name: /追加する/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(useChatStore.getState().messages[0].pendingAction?.status).toBe(
      'rejected',
    )
  })

  test('shows error banner when chatStore has error', () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useChatStore.setState({
      messages: [],
      isLoading: false,
      error: 'エラーが発生しました',
    })
    renderAIChatPage()
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
  })

  test('shows loading indicator during isLoading', () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useChatStore.setState({
      messages: [],
      isLoading: true,
      error: null,
    })
    renderAIChatPage()
    expect(screen.getByText('考え中…')).toBeInTheDocument()
  })

  test('calls approve when approve button clicked in confirmation bubble', async () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useChatStore.setState({
      messages: [
        {
          id: 'm1',
          role: 'assistant',
          content: '追加しますか？',
          timestamp: '2026-04-18T12:00:00+09:00' as never,
          pendingAction: {
            id: 'pa',
            type: 'addExercise',
            description: '追加しますか？',
            data: { actionType: 'addExercise', name: 'ベンチプレス' },
            status: 'pending',
          },
        },
      ],
      isLoading: false,
      error: null,
    })
    renderAIChatPage()
    await userEvent.click(screen.getByRole('button', { name: /追加する/ }))
    expect(useChatStore.getState().messages[0].pendingAction?.status).toBe('approved')
  })
})
