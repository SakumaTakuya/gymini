import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  createRouter,
  createRootRoute,
  createRoute,
  createHashHistory,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import { GearIcon } from './GearIcon'
import { useSettingsStore } from '../stores/settingsStore'

function renderGearIcon() {
  const rootRoute = createRootRoute({
    component: () => (
      <div style={{ position: 'relative' }}>
        <GearIcon />
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
  const hashHistory = createHashHistory()
  const router = createRouter({ routeTree, history: hashHistory })
  router.navigate({ to: '/training' })

  return render(<RouterProvider router={router} />)
}

describe('GearIcon', () => {
  beforeEach(() => {
    useSettingsStore.setState({ apiKey: '', hasApiKey: false })
  })

  it('renders a link to settings', async () => {
    renderGearIcon()
    const link = await screen.findByRole('link')
    expect(link).toBeInTheDocument()
  })

  it('shows red badge when API key is not set', async () => {
    useSettingsStore.setState({ apiKey: '', hasApiKey: false })
    renderGearIcon()
    await screen.findByRole('link')
    const badge = document.querySelector('.bg-accent')
    expect(badge).toBeInTheDocument()
  })

  it('hides red badge when API key is set', async () => {
    useSettingsStore.setState({ apiKey: 'test-key', hasApiKey: true })
    renderGearIcon()
    await screen.findByRole('link')
    const badge = document.querySelector('.bg-accent')
    expect(badge).not.toBeInTheDocument()
  })

  it('has accessible tap target (min 44px)', async () => {
    renderGearIcon()
    const link = await screen.findByRole('link')
    expect(link.className).toContain('min-h-[44px]')
    expect(link.className).toContain('min-w-[44px]')
  })

  it('forwards className prop to the link element', async () => {
    function renderWithClassName() {
      const rootRoute = createRootRoute({
        component: () => (
          <div style={{ position: 'relative' }}>
            <GearIcon className="absolute top-12 right-4 z-30" />
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

    renderWithClassName()
    const link = await screen.findByRole('link')
    expect(link.className).toContain('absolute')
    expect(link.className).toContain('top-12')
    expect(link.className).toContain('right-4')
  })
})
