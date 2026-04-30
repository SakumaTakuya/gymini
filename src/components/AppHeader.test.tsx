import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppHeader } from './AppHeader'

describe('AppHeader', () => {
  it('renders the title in an h1 banner', () => {
    render(<AppHeader title="設定" />)
    const banner = screen.getByRole('banner')
    expect(banner).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '設定' })).toBeInTheDocument()
  })

  it('renders leading and trailing slots', () => {
    render(
      <AppHeader
        title="設定"
        leading={<span data-testid="leading">L</span>}
        trailing={<button>action</button>}
      />,
    )
    expect(screen.getByTestId('leading')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'action' })).toBeInTheDocument()
  })

  it('applies pill shape with h-11 and rounded-full', () => {
    render(<AppHeader title="設定" />)
    const banner = screen.getByRole('banner')
    expect(banner.className).toContain('h-11')
    expect(banner.className).toContain('rounded-full')
    expect(banner.className).toContain('fixed')
  })

  it('applies frosted background', () => {
    render(<AppHeader title="設定" />)
    const banner = screen.getByRole('banner')
    expect(banner.className).toContain('bg-white/80')
    expect(banner.className).toContain('backdrop-blur-xl')
  })
})
