import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createRouter,
  createRootRoute,
  createRoute,
  createHashHistory,
  RouterProvider,
  Outlet,
  Navigate,
} from '@tanstack/react-router'
import { BottomNav } from '../components/BottomNav'
import { GearIcon } from '../components/GearIcon'

function createTestRouter(initialPath = '/training') {
  const rootRoute = createRootRoute({
    component: () => (
      <div className="min-h-screen bg-zinc-50">
        <Outlet />
      </div>
    ),
    notFoundComponent: () => <Navigate to="/training" />,
  })

  const appLayoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: '_app',
    component: () => (
      <>
        <GearIcon />
        <main className="flex-1 pb-24">
          <Outlet />
        </main>
        <BottomNav />
      </>
    ),
  })

  const trainingRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/training',
    component: () => <div data-testid="training-page">トレーニング</div>,
  })

  const historyRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/history',
    component: () => <div data-testid="history-page">履歴</div>,
  })

  const aiRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/ai',
    component: () => <div data-testid="ai-page">AI チャット</div>,
  })

  const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: () => (
      <div data-testid="settings-page">
        <button data-testid="close-settings">閉じる</button>
        設定
      </div>
    ),
  })

  const routeTree = rootRoute.addChildren([
    appLayoutRoute.addChildren([trainingRoute, historyRoute, aiRoute]),
    settingsRoute,
  ])

  const hashHistory = createHashHistory()
  const router = createRouter({ routeTree, history: hashHistory })

  router.navigate({ to: initialPath })

  return router
}

describe('Navigation Integration', () => {
  it('navigates from training to history via BottomNav', async () => {
    const user = userEvent.setup()
    const router = createTestRouter('/training')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('training-page')

    await user.click(screen.getByText('履歴'))
    expect(await screen.findByTestId('history-page')).toBeInTheDocument()
  })

  it('navigates from training to AI via BottomNav', async () => {
    const user = userEvent.setup()
    const router = createTestRouter('/training')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('training-page')

    await user.click(screen.getByText('AI'))
    expect(await screen.findByTestId('ai-page')).toBeInTheDocument()
  })

  it('shows BottomNav on FRAME1-4 pages', async () => {
    const router = createTestRouter('/training')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('training-page')
    expect(screen.getByText('トレ')).toBeInTheDocument()
    expect(screen.getByText('履歴')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('hides BottomNav on settings page (FR-008)', async () => {
    const router = createTestRouter('/settings')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('settings-page')
    expect(screen.queryByText('トレ')).not.toBeInTheDocument()
  })

  it('navigates to settings via GearIcon', async () => {
    const user = userEvent.setup()
    const router = createTestRouter('/training')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('training-page')

    // GearIcon is a link to /settings
    const gearLinks = screen.getAllByRole('link')
    const settingsLink = gearLinks.find((link) =>
      link.getAttribute('href')?.includes('settings'),
    )
    expect(settingsLink).toBeDefined()

    if (settingsLink) {
      await user.click(settingsLink)
      expect(await screen.findByTestId('settings-page')).toBeInTheDocument()
    }
  })

  it('navigates between tabs maintaining layout', async () => {
    const user = userEvent.setup()
    const router = createTestRouter('/training')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('training-page')

    // Go to history
    await user.click(screen.getByText('履歴'))
    await screen.findByTestId('history-page')
    expect(screen.getByText('トレ')).toBeInTheDocument() // BottomNav still visible

    // Go to AI
    await user.click(screen.getByText('AI'))
    await screen.findByTestId('ai-page')
    expect(screen.getByText('トレ')).toBeInTheDocument() // BottomNav still visible

    // Back to training
    await user.click(screen.getByText('トレ'))
    await screen.findByTestId('training-page')
  })
})
