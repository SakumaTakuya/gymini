import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatBubble } from './ChatBubble'

describe('ChatBubble', () => {
  describe('ユーザーメッセージ', () => {
    it('テキストを表示する', () => {
      render(<ChatBubble role="user" content="やあ" />)
      expect(screen.getByText('やあ')).toBeInTheDocument()
    })

    it('右寄せで配置される', () => {
      const { container } = render(<ChatBubble role="user" content="test" />)
      expect(container.firstChild).toHaveClass('justify-end')
    })

    it('Markdown 記法をそのままテキストとして表示する（変換しない）', () => {
      render(<ChatBubble role="user" content="**太字**のテキスト" />)
      expect(screen.getByText('**太字**のテキスト')).toBeInTheDocument()
      expect(document.querySelector('strong')).not.toBeInTheDocument()
    })
  })

  describe('アシスタントメッセージ', () => {
    it('テキストを表示する', () => {
      render(<ChatBubble role="assistant" content="こんにちは" />)
      expect(screen.getByText('こんにちは')).toBeInTheDocument()
    })

    it('左寄せで配置される', () => {
      const { container } = render(<ChatBubble role="assistant" content="test" />)
      expect(container.firstChild).toHaveClass('justify-start')
    })

    it('Markdown をリスト形式でレンダリングする', () => {
      render(<ChatBubble role="assistant" content={'- 項目1\n- 項目2'} />)
      expect(screen.getByText('項目1')).toBeInTheDocument()
      expect(screen.getByText('項目2')).toBeInTheDocument()
    })

    it('Markdown をテーブル形式でレンダリングする', () => {
      render(
        <ChatBubble
          role="assistant"
          content={'| 種目 | 回数 |\n|------|------|\n| ベンチ | 10 |'}
        />,
      )
      expect(screen.getByText('種目')).toBeInTheDocument()
      expect(screen.getByText('ベンチ')).toBeInTheDocument()
    })

    it('content が空のとき "..." を表示する', () => {
      render(<ChatBubble role="assistant" content="" />)
      expect(screen.getByText('...')).toBeInTheDocument()
    })
  })
})
