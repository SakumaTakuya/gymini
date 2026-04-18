import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { ChatInput } from './ChatInput'

describe('ChatInput', () => {
  test('submits on send button click and clears input', async () => {
    const onSend = vi.fn()
    render(
      <ChatInput isLoading={false} onSend={onSend} onStop={vi.fn()} />,
    )
    const input = screen.getByPlaceholderText('メッセージを入力')
    await userEvent.type(input, 'こんにちは')
    await userEvent.click(screen.getByRole('button', { name: '送信' }))
    expect(onSend).toHaveBeenCalledWith('こんにちは')
    expect(input).toHaveValue('')
  })

  test('submits on Enter (no shift)', async () => {
    const onSend = vi.fn()
    render(
      <ChatInput isLoading={false} onSend={onSend} onStop={vi.fn()} />,
    )
    const input = screen.getByPlaceholderText('メッセージを入力')
    await userEvent.type(input, 'hello{Enter}')
    expect(onSend).toHaveBeenCalledWith('hello')
  })

  test('Shift+Enter inserts newline instead of submitting', async () => {
    const onSend = vi.fn()
    render(
      <ChatInput isLoading={false} onSend={onSend} onStop={vi.fn()} />,
    )
    const input = screen.getByPlaceholderText('メッセージを入力')
    await userEvent.type(input, 'a{Shift>}{Enter}{/Shift}b')
    expect(onSend).not.toHaveBeenCalled()
    expect(input).toHaveValue('a\nb')
  })

  test('shows stop button when loading', async () => {
    const onStop = vi.fn()
    render(
      <ChatInput isLoading={true} onSend={vi.fn()} onStop={onStop} />,
    )
    expect(
      screen.queryByRole('button', { name: '送信' }),
    ).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '応答を停止' }))
    expect(onStop).toHaveBeenCalled()
  })

  test('disables submit when disabled or empty', () => {
    render(
      <ChatInput
        isLoading={false}
        onSend={vi.fn()}
        onStop={vi.fn()}
        disabled
      />,
    )
    expect(screen.getByRole('button', { name: '送信' })).toBeDisabled()
  })

  test('ignores whitespace-only message', async () => {
    const onSend = vi.fn()
    render(
      <ChatInput isLoading={false} onSend={onSend} onStop={vi.fn()} />,
    )
    const input = screen.getByPlaceholderText('メッセージを入力')
    await userEvent.type(input, '   {Enter}')
    expect(onSend).not.toHaveBeenCalled()
  })
})
