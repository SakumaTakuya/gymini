import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatErrorBanner } from './ChatErrorBanner'

describe('ChatErrorBanner', () => {
  it('エラー文言を表示する', () => {
    render(
      <ChatErrorBanner
        error="ネットワークエラーです"
        lastFailedInput={null}
        isLoading={false}
        onRetry={() => {}}
      />,
    )
    expect(screen.getByText('ネットワークエラーです')).toBeInTheDocument()
  })

  it('lastFailedInput が null のとき 再送ボタンを表示しない', () => {
    render(
      <ChatErrorBanner
        error="エラー"
        lastFailedInput={null}
        isLoading={false}
        onRetry={() => {}}
      />,
    )
    expect(screen.queryByRole('button', { name: '再送' })).toBeNull()
  })

  it('lastFailedInput がある場合は再送ボタンを表示し、押下で onRetry を呼ぶ', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(
      <ChatErrorBanner
        error="エラー"
        lastFailedInput="ベンチプレスやる"
        isLoading={false}
        onRetry={onRetry}
      />,
    )
    await user.click(screen.getByRole('button', { name: '再送' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('isLoading=true のとき再送ボタンを無効化する', () => {
    render(
      <ChatErrorBanner
        error="エラー"
        lastFailedInput="ベンチプレスやる"
        isLoading={true}
        onRetry={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: '再送' })).toBeDisabled()
  })
})
