import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorFallback } from './ErrorFallback'

describe('ErrorFallback', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('エラーメッセージを表示する', () => {
    render(<ErrorFallback error={new Error('壊れました')} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('壊れました')).toBeInTheDocument()
  })

  it('メッセージが空のときフォールバック文言を表示する', () => {
    render(<ErrorFallback error={new Error('')} />)
    expect(
      screen.getByText('予期しないエラーが発生しました。'),
    ).toBeInTheDocument()
  })

  it('再読み込みボタンで location.reload を呼ぶ', async () => {
    const reload = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    })
    const user = userEvent.setup()
    render(<ErrorFallback error={new Error('boom')} />)
    await user.click(screen.getByRole('button', { name: '再読み込み' }))
    expect(reload).toHaveBeenCalledOnce()
  })
})
