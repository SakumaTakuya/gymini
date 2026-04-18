import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { ChatBubble } from './ChatBubble'

describe('ChatBubble', () => {
  test('renders user message right-aligned with black bg', () => {
    const { container } = render(<ChatBubble role="user" content="やあ" />)
    expect(screen.getByText('やあ')).toBeInTheDocument()
    const bubble = container.querySelector('.bg-black')
    expect(bubble).toBeTruthy()
  })

  test('renders assistant message left-aligned', () => {
    const { container } = render(
      <ChatBubble role="assistant" content="こんにちは" />,
    )
    expect(screen.getByText('こんにちは')).toBeInTheDocument()
    expect(container.querySelector('.bg-white')).toBeTruthy()
  })

  test('renders assistant markdown: list', () => {
    const md = '- 項目1\n- 項目2'
    render(<ChatBubble role="assistant" content={md} />)
    expect(screen.getByText('項目1')).toBeInTheDocument()
    expect(screen.getByText('項目2')).toBeInTheDocument()
  })

  test('renders assistant markdown: table', () => {
    const md = '| 種目 | 回数 |\n|------|------|\n| ベンチ | 10 |'
    render(<ChatBubble role="assistant" content={md} />)
    expect(screen.getByText('種目')).toBeInTheDocument()
    expect(screen.getByText('ベンチ')).toBeInTheDocument()
  })
})
