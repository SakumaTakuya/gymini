import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatErrorBanner } from './ChatErrorBanner'

describe('ChatErrorBanner', () => {
  it('エラー文言を表示する', () => {
    render(
      <ChatErrorBanner
        error="ネットワークエラーです"
        canRetry={false}
        isLoading={false}
        onRetry={() => {}}
      />,
    )
    expect(screen.getByText('ネットワークエラーです')).toBeInTheDocument()
  })

  it('canRetry=false のとき 再送ボタンを表示しない', () => {
    render(
      <ChatErrorBanner
        error="エラー"
        canRetry={false}
        isLoading={false}
        onRetry={() => {}}
      />,
    )
    expect(screen.queryByRole('button', { name: '再送' })).toBeNull()
  })

  it('canRetry=true のとき再送ボタンを表示し、押下で onRetry を呼ぶ', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(
      <ChatErrorBanner
        error="エラー"
        canRetry={true}
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
        canRetry={true}
        isLoading={true}
        onRetry={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: '再送' })).toBeDisabled()
  })
})
