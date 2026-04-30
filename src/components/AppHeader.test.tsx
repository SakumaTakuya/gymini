import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppHeader } from './AppHeader'

describe('AppHeader', () => {
  it('renders the title in an h1 banner', () => {
    render(<AppHeader title="履歴" />)
    const banner = screen.getByRole('banner')
    expect(banner).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '履歴' })).toBeInTheDocument()
  })

  it('renders leading and trailing slots', () => {
    render(
      <AppHeader
        title="AIコーチ"
        leading={<span data-testid="leading">L</span>}
        trailing={<button>action</button>}
      />,
    )
    expect(screen.getByTestId('leading')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'action' })).toBeInTheDocument()
  })

  it('applies the default sticky 56px height class', () => {
    render(<AppHeader title="設定" />)
    const banner = screen.getByRole('banner')
    expect(banner.className).toContain('h-14')
    expect(banner.className).toContain('sticky')
  })

  it('uses min-h with padding when variant is session-active', () => {
    render(<AppHeader title="セッション中" variant="session-active" />)
    const banner = screen.getByRole('banner')
    expect(banner.className).toContain('min-h-14')
    expect(banner.className).toContain('py-2')
    expect(banner.dataset.variant).toBe('session-active')
  })

  it('marks variant in data-variant attribute', () => {
    render(<AppHeader title="設定" variant="modal" />)
    expect(screen.getByRole('banner').dataset.variant).toBe('modal')
  })

  it('applies frosted background and bottom border', () => {
    render(<AppHeader title="x" />)
    const banner = screen.getByRole('banner')
    expect(banner.className).toContain('bg-white/80')
    expect(banner.className).toContain('backdrop-blur-xl')
    expect(banner.className).toContain('border-b')
  })

  it('omits sticky positioning when sticky=false', () => {
    render(<AppHeader title="x" sticky={false} />)
    const banner = screen.getByRole('banner')
    expect(banner.className).toContain('relative')
    expect(banner.className).not.toContain('sticky')
  })
})
