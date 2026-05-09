import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmationActions } from './ConfirmationActions'

// コンテナ非依存の単体テスト: props のみで動作することを保証する。
// store/hook への依存は無く、ConfirmationBubble などコンテナの外でも使える。

describe('ConfirmationActions', () => {
  const baseProps = {
    label: '保存する',
    canApprove: true,
    isSettled: false,
    onApprove: vi.fn(),
    onReject: vi.fn(),
  }

  it('label を承認ボタンに表示する', () => {
    render(<ConfirmationActions {...baseProps} />)
    expect(screen.getByRole('button', { name: /保存する/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument()
  })

  it('承認ボタンクリックで onApprove を呼ぶ', () => {
    const onApprove = vi.fn()
    render(<ConfirmationActions {...baseProps} onApprove={onApprove} />)
    fireEvent.click(screen.getByRole('button', { name: /保存する/ }))
    expect(onApprove).toHaveBeenCalledOnce()
  })

  it('キャンセルクリックで onReject を呼ぶ', () => {
    const onReject = vi.fn()
    render(<ConfirmationActions {...baseProps} onReject={onReject} />)
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(onReject).toHaveBeenCalledOnce()
  })

  it('canApprove=false のとき承認ボタンが disabled', () => {
    render(<ConfirmationActions {...baseProps} canApprove={false} />)
    expect(screen.getByRole('button', { name: /保存する/ })).toBeDisabled()
  })

  it('isSettled=true のときキャンセルも disabled', () => {
    render(<ConfirmationActions {...baseProps} isSettled={true} />)
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled()
  })

  it('showFillHint=true のときヒントを表示する', () => {
    render(<ConfirmationActions {...baseProps} canApprove={false} showFillHint />)
    expect(screen.getByText('重量と回数を入力してください')).toBeInTheDocument()
  })

  it('showFillHint が無いときヒントは表示されない', () => {
    render(<ConfirmationActions {...baseProps} />)
    expect(screen.queryByText('重量と回数を入力してください')).not.toBeInTheDocument()
  })
})
