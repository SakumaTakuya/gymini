import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { ChatInput } from './ChatInput'

describe('ChatInput', () => {
  test('送信ボタンクリックで送信しinputをクリアする', async () => {
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

  test('Enterキー（Shiftなし）で送信する', async () => {
    const onSend = vi.fn()
    render(
      <ChatInput isLoading={false} onSend={onSend} onStop={vi.fn()} />,
    )
    const input = screen.getByPlaceholderText('メッセージを入力')
    await userEvent.type(input, 'hello{Enter}')
    expect(onSend).toHaveBeenCalledWith('hello')
  })

  test('Shift+Enterは送信せず改行を挿入する', async () => {
    const onSend = vi.fn()
    render(
      <ChatInput isLoading={false} onSend={onSend} onStop={vi.fn()} />,
    )
    const input = screen.getByPlaceholderText('メッセージを入力')
    await userEvent.type(input, 'a{Shift>}{Enter}{/Shift}b')
    expect(onSend).not.toHaveBeenCalled()
    expect(input).toHaveValue('a\nb')
  })

  test('ローディング中は停止ボタンを表示する', async () => {
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

  test('disabledまたは空のとき送信ボタンを無効化する', () => {
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

  test('空白のみのメッセージは送信しない', async () => {
    const onSend = vi.fn()
    render(
      <ChatInput isLoading={false} onSend={onSend} onStop={vi.fn()} />,
    )
    const input = screen.getByPlaceholderText('メッセージを入力')
    await userEvent.type(input, '   {Enter}')
    expect(onSend).not.toHaveBeenCalled()
  })

  test('textarea に enterKeyHint="send" を設定する', () => {
    render(
      <ChatInput isLoading={false} onSend={vi.fn()} onStop={vi.fn()} />,
    )
    expect(screen.getByPlaceholderText('メッセージを入力')).toHaveAttribute(
      'enterkeyhint',
      'send',
    )
  })

  describe('種目検索 popover (P8)', () => {
    const exercises = [
      { id: 'ex-1', name: 'ベンチプレス' },
      { id: 'ex-2', name: 'ベントオーバーロウ' },
      { id: 'ex-3', name: 'スクワット' },
    ]
    const searchExercises = (q: string) =>
      exercises.filter((e) =>
        e.name.toLowerCase().includes(q.toLowerCase()),
      )

    test('入力中に候補が見つかれば popover を表示する', async () => {
      render(
        <ChatInput
          isLoading={false}
          onSend={vi.fn()}
          onStop={vi.fn()}
          exerciseSearch={{
            search: searchExercises,
            onSelect: vi.fn(),
            create: vi.fn(),
          }}
        />,
      )
      const input = screen.getByPlaceholderText('メッセージを入力')
      await userEvent.type(input, 'ベ')
      expect(
        screen.getByRole('button', { name: 'ベンチプレス' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'ベントオーバーロウ' }),
      ).toBeInTheDocument()
    })

    test('候補チップタップで onSelect を呼びテキストをクリアする', async () => {
      const onSelect = vi.fn()
      render(
        <ChatInput
          isLoading={false}
          onSend={vi.fn()}
          onStop={vi.fn()}
          exerciseSearch={{
            search: searchExercises,
            onSelect,
            create: vi.fn(),
          }}
        />,
      )
      const input = screen.getByPlaceholderText('メッセージを入力')
      await userEvent.type(input, 'ベンチ')
      await userEvent.click(
        screen.getByRole('button', { name: 'ベンチプレス' }),
      )
      expect(onSelect).toHaveBeenCalledWith({
        exerciseId: 'ex-1',
        exerciseName: 'ベンチプレス',
      })
      expect(input).toHaveValue('')
    })

    test('候補が完全一致しない場合「『○○』を新規追加」チップを表示する', async () => {
      render(
        <ChatInput
          isLoading={false}
          onSend={vi.fn()}
          onStop={vi.fn()}
          exerciseSearch={{
            search: searchExercises,
            onSelect: vi.fn(),
            create: vi.fn(),
          }}
        />,
      )
      const input = screen.getByPlaceholderText('メッセージを入力')
      await userEvent.type(input, 'ラットプルダウン')
      expect(
        screen.getByRole('button', { name: /「ラットプルダウン」を新規追加/ }),
      ).toBeInTheDocument()
    })

    test('「新規追加」チップタップで create + onSelect + クリアを実行する', async () => {
      const onSelect = vi.fn()
      const create = vi.fn(() => ({ id: 'ex-new', name: 'ラットプルダウン' }))
      render(
        <ChatInput
          isLoading={false}
          onSend={vi.fn()}
          onStop={vi.fn()}
          exerciseSearch={{ search: searchExercises, onSelect, create }}
        />,
      )
      const input = screen.getByPlaceholderText('メッセージを入力')
      await userEvent.type(input, 'ラットプルダウン')
      await userEvent.click(
        screen.getByRole('button', { name: /「ラットプルダウン」を新規追加/ }),
      )
      expect(create).toHaveBeenCalledWith('ラットプルダウン')
      expect(onSelect).toHaveBeenCalledWith({
        exerciseId: 'ex-new',
        exerciseName: 'ラットプルダウン',
      })
      expect(input).toHaveValue('')
    })

    test('Enter キーは候補があっても AI 送信を呼ぶ', async () => {
      const onSend = vi.fn()
      const onSelect = vi.fn()
      render(
        <ChatInput
          isLoading={false}
          onSend={onSend}
          onStop={vi.fn()}
          exerciseSearch={{
            search: searchExercises,
            onSelect,
            create: vi.fn(),
          }}
        />,
      )
      const input = screen.getByPlaceholderText('メッセージを入力')
      await userEvent.type(input, 'ベンチ{Enter}')
      expect(onSend).toHaveBeenCalledWith('ベンチ')
      expect(onSelect).not.toHaveBeenCalled()
    })

    test('テキストが空のときは popover を表示しない', async () => {
      render(
        <ChatInput
          isLoading={false}
          onSend={vi.fn()}
          onStop={vi.fn()}
          exerciseSearch={{
            search: searchExercises,
            onSelect: vi.fn(),
            create: vi.fn(),
          }}
        />,
      )
      expect(
        screen.queryByRole('button', { name: 'ベンチプレス' }),
      ).not.toBeInTheDocument()
    })

    test('exerciseSearch prop が無くても従来挙動で AI 送信は機能する', async () => {
      const onSend = vi.fn()
      render(
        <ChatInput isLoading={false} onSend={onSend} onStop={vi.fn()} />,
      )
      const input = screen.getByPlaceholderText('メッセージを入力')
      await userEvent.type(input, 'ベンチ{Enter}')
      expect(onSend).toHaveBeenCalledWith('ベンチ')
    })
  })
})
