import type { AnchorHTMLAttributes, PropsWithChildren, ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
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

  test('APIキーが未設定のときガイダンスを表示する', () => {
    renderAIChatPage()
    expect(screen.getByText('APIキーが必要です')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /設定画面へ/ })).toBeInTheDocument()
  })

  test('設定へのギアリンクを描画する', () => {
    renderAIChatPage()
    const settingsLink = screen
      .getAllByRole('link')
      .find((l) => l.getAttribute('href') === '/settings')
    expect(settingsLink).toBeDefined()
  })

  test('APIキーが設定済みのときガイダンスを表示しない', () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    renderAIChatPage()
    expect(screen.queryByText('APIキーが必要です')).not.toBeInTheDocument()
  })

  test('メッセージがない場合は空状態メッセージを表示する', () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    renderAIChatPage()
    expect(
      screen.getByText('AI コーチとチャットを始めましょう'),
    ).toBeInTheDocument()
  })

  test('ユーザーとアシスタントのメッセージを描画する', () => {
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

  test('chatStoreにエラーがある場合はエラーバナーを表示する', () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useChatStore.setState({
      messages: [],
      isLoading: false,
      error: 'エラーが発生しました',
    })
    renderAIChatPage()
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
  })

  test('isLoading中はローディングインジケーターを表示する', () => {
    useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
    useChatStore.setState({
      messages: [],
      isLoading: true,
      error: null,
    })
    renderAIChatPage()
    expect(screen.getByText('考え中…')).toBeInTheDocument()
  })

})
