import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StorageErrorBanner } from './StorageErrorBanner'
import { safeSetItem } from '../lib/storage'

function triggerQuotaError() {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError')
  })
  safeSetItem('k', 'v')
}

describe('StorageErrorBanner', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('エラーが無いとき何も表示しない', () => {
    const { container } = render(<StorageErrorBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('quota エラー時に警告バナーを表示する', () => {
    triggerQuotaError()
    render(<StorageErrorBanner />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/空き容量/)).toBeInTheDocument()
  })

  it('閉じるボタンでバナーを消す', async () => {
    triggerQuotaError()
    const user = userEvent.setup()
    render(<StorageErrorBanner />)
    await user.click(screen.getByRole('button', { name: '閉じる' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
