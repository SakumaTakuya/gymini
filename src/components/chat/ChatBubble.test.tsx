import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChatBubble } from './ChatBubble'
import type { ProposedAction } from '../../types/chat'

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

    it('共通の出現アニメ(animate-appear)が付く', () => {
      const { container } = render(<ChatBubble role="user" content="x" />)
      expect(container.firstChild).toHaveClass('animate-appear')
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

    it('共通の出現アニメ(animate-appear)が付く', () => {
      const { container } = render(<ChatBubble role="assistant" content="x" />)
      expect(container.firstChild).toHaveClass('animate-appear')
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

  describe('提案チップ (actions)', () => {
    const actions: ProposedAction[] = [
      {
        id: 'a1',
        label: 'ベンチプレスを始める',
        kind: 'start-exercise',
        payload: { exerciseName: 'ベンチプレス' },
      },
      {
        id: 'a2',
        label: '前回履歴を見る',
        kind: 'show-history',
        payload: { exerciseName: 'ベンチプレス' },
      },
    ]

    it('actions が渡されたとき chip がボタンとして表示される', () => {
      render(
        <ChatBubble
          role="assistant"
          content="候補:"
          actions={actions}
          onActionClick={() => {}}
        />,
      )
      expect(
        screen.getByRole('button', { name: /ベンチプレスを始める/ }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /前回履歴を見る/ }),
      ).toBeInTheDocument()
    })

    it('chip クリックで onActionClick がその action を引数に呼ばれる', async () => {
      const user = userEvent.setup()
      const onActionClick = vi.fn()
      render(
        <ChatBubble
          role="assistant"
          content="候補:"
          actions={actions}
          onActionClick={onActionClick}
        />,
      )
      await user.click(
        screen.getByRole('button', { name: /ベンチプレスを始める/ }),
      )
      expect(onActionClick).toHaveBeenCalledTimes(1)
      expect(onActionClick).toHaveBeenCalledWith(actions[0])
    })

    it('consumedActionId が指定されたとき全 chip が disabled になる', () => {
      render(
        <ChatBubble
          role="assistant"
          content="候補:"
          actions={actions}
          consumedActionId="a1"
          onActionClick={() => {}}
        />,
      )
      expect(
        screen.getByRole('button', { name: /ベンチプレスを始める/ }),
      ).toBeDisabled()
      expect(
        screen.getByRole('button', { name: /前回履歴を見る/ }),
      ).toBeDisabled()
    })

    it('user メッセージには actions を描画しない', () => {
      render(
        <ChatBubble
          role="user"
          content="やあ"
          actions={actions}
          onActionClick={() => {}}
        />,
      )
      expect(
        screen.queryByRole('button', { name: /ベンチプレスを始める/ }),
      ).not.toBeInTheDocument()
    })

    it('actions が空配列のときも chip エリアは描画しない', () => {
      render(
        <ChatBubble
          role="assistant"
          content="ただのテキスト"
          actions={[]}
          onActionClick={() => {}}
        />,
      )
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })
})
