import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  createRouter,
  createRootRoute,
  createRoute,
  createHashHistory,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import { SessionHeader } from './SessionHeader'

function renderSessionHeader(props: {
  elapsedSeconds: number
  onEndSession: () => void
}) {
  const rootRoute = createRootRoute({
    component: () => (
      <div style={{ position: 'relative' }}>
        <SessionHeader {...props} />
        <Outlet />
      </div>
    ),
  })
  const trainingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/training',
    component: () => <div>Training</div>,
  })
  const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: () => <div>Settings</div>,
  })
  const routeTree = rootRoute.addChildren([trainingRoute, settingsRoute])
  const router = createRouter({ routeTree, history: createHashHistory() })
  router.navigate({ to: '/training' })
  return render(<RouterProvider router={router} />)
}

describe('SessionHeader', () => {
  it('renders the gear link to settings', async () => {
    renderSessionHeader({ elapsedSeconds: 0, onEndSession: vi.fn() })
    const settingsLink = await screen.findByRole('link')
    expect(settingsLink.getAttribute('href')).toContain('settings')
  })

  it('renders 終了 button', async () => {
    renderSessionHeader({ elapsedSeconds: 0, onEndSession: vi.fn() })
    expect(
      await screen.findByRole('button', { name: '終了' }),
    ).toBeInTheDocument()
  })

  it('calls onEndSession when 終了 is clicked', async () => {
    const onEndSession = vi.fn()
    renderSessionHeader({ elapsedSeconds: 0, onEndSession })
    fireEvent.click(await screen.findByRole('button', { name: '終了' }))
    expect(onEndSession).toHaveBeenCalledOnce()
  })

  it('renders timer at 00:00:00 when elapsed is 0', async () => {
    renderSessionHeader({ elapsedSeconds: 0, onEndSession: vi.fn() })
    expect(await screen.findByText('00:00:00')).toBeInTheDocument()
  })

  it('formats elapsed seconds as HH:MM:SS', async () => {
    renderSessionHeader({
      elapsedSeconds: 14 * 60 + 32,
      onEndSession: vi.fn(),
    })
    expect(await screen.findByText('00:14:32')).toBeInTheDocument()
  })

  it('formats elapsed seconds beyond an hour', async () => {
    renderSessionHeader({
      elapsedSeconds: 2 * 3600 + 5 * 60 + 9,
      onEndSession: vi.fn(),
    })
    expect(await screen.findByText('02:05:09')).toBeInTheDocument()
  })
})
