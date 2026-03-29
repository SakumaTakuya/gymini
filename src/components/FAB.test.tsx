import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FAB from './FAB'

describe('FAB', () => {
  it('renders in DOM even when visible=false', () => {
    const { container } = render(<FAB visible={false} onClick={() => {}} />)
    const btn = container.querySelector('button')
    expect(btn).toBeInTheDocument()
  })

  it('has invisible and pointer-events-none when visible=false', () => {
    const { container } = render(<FAB visible={false} onClick={() => {}} />)
    const btn = container.querySelector('button')
    expect(btn?.className).toMatch(/invisible/)
    expect(btn?.className).toMatch(/pointer-events-none/)
  })

  it('does not have invisible when visible=true', () => {
    const { container } = render(<FAB visible={true} onClick={() => {}} />)
    const btn = container.querySelector('button')
    expect(btn?.className).not.toMatch(/invisible/)
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<FAB visible={true} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('meets minimum tap target size (44px)', () => {
    const { container } = render(<FAB visible={true} onClick={() => {}} />)
    const btn = container.querySelector('button')
    expect(btn?.className).toMatch(/min-h-\[44px\]/)
    expect(btn?.className).toMatch(/min-w-\[44px\]/)
  })
})
