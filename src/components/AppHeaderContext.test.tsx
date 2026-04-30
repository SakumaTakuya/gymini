import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { AppHeaderProvider, AppHeaderContent } from './AppHeaderContext'

describe('AppHeaderProvider + AppHeaderContent', () => {
  it('provides an empty header until a child registers content', () => {
    render(
      <AppHeaderProvider>
        <div>body</div>
      </AppHeaderProvider>,
    )
    const banner = screen.getByRole('banner')
    expect(banner).toBeInTheDocument()
    expect(banner.dataset.variant).toBe('default')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('')
  })

  it('renders title published by a child via portal', () => {
    render(
      <AppHeaderProvider>
        <AppHeaderContent title="履歴" />
      </AppHeaderProvider>,
    )
    expect(screen.getByRole('heading', { level: 1, name: '履歴' })).toBeInTheDocument()
  })

  it('renders leading and trailing slots via portal', () => {
    render(
      <AppHeaderProvider>
        <AppHeaderContent
          title="AIコーチ"
          leading={<span data-testid="lead-icon">L</span>}
          trailing={<button>act</button>}
        />
      </AppHeaderProvider>,
    )
    expect(screen.getByTestId('lead-icon')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'act' })).toBeInTheDocument()
  })

  it('switches variant when a child requests session-active', () => {
    render(
      <AppHeaderProvider>
        <AppHeaderContent title="セッション中" variant="session-active" />
      </AppHeaderProvider>,
    )
    expect(screen.getByRole('banner').dataset.variant).toBe('session-active')
  })

  it('updates trailing reactively when child re-renders', async () => {
    function Counter() {
      const [n, setN] = useState(0)
      return (
        <>
          <AppHeaderContent
            title="counter"
            trailing={<span data-testid="count">{n}</span>}
          />
          <button onClick={() => setN((v) => v + 1)}>inc</button>
        </>
      )
    }
    render(
      <AppHeaderProvider>
        <Counter />
      </AppHeaderProvider>,
    )
    expect(screen.getByTestId('count').textContent).toBe('0')
    await userEvent.click(screen.getByRole('button', { name: 'inc' }))
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('throws when AppHeaderContent is used without provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<AppHeaderContent title="x" />)).toThrow(
      /AppHeaderProvider/,
    )
    spy.mockRestore()
  })
})
