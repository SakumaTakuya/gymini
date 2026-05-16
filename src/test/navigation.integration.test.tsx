import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
      <div className="min-h-screen bg-gym-zinc-50">
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
        <main className="h-dvh flex flex-col pb-content-bottom">
          <Outlet />
        </main>
        <BottomNav />
      </>
    ),
  })

  const trainingRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/training',
    component: () => (
      <div data-testid="training-page">
        <GearIcon className="absolute top-12 right-4 z-30" />
        トレーニング
      </div>
    ),
  })

  const historyRoute = createRoute({
    getParentRoute: () => appLayoutRoute,
    path: '/history',
    component: () => (
      <div data-testid="history-page">
        <GearIcon className="absolute top-12 right-4 z-30" />
        履歴
      </div>
    ),
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
    appLayoutRoute.addChildren([trainingRoute, historyRoute]),
    settingsRoute,
  ])

  const hashHistory = createHashHistory()
  const router = createRouter({ routeTree, history: hashHistory })

  router.navigate({ to: initialPath })

  return router
}

describe('ナビゲーション統合テスト', () => {
  it('BottomNav でトレーニングから履歴へ遷移する', async () => {
    const user = userEvent.setup()
    const router = createTestRouter('/training')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('training-page')

    await user.click(screen.getByText('履歴'))
    expect(await screen.findByTestId('history-page')).toBeInTheDocument()
  })

  it('AI 専用タブは存在しない (P9 撤去)', async () => {
    const router = createTestRouter('/training')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('training-page')
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })

  it('トレ / 履歴 のページで BottomNav を表示する', async () => {
    const router = createTestRouter('/training')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('training-page')
    expect(screen.getByText('トレ')).toBeInTheDocument()
    expect(screen.getByText('履歴')).toBeInTheDocument()
  })

  it('設定ページでは BottomNav を非表示にする', async () => {
    const router = createTestRouter('/settings')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('settings-page')
    expect(screen.queryByText('トレ')).not.toBeInTheDocument()
  })

  it('GearIcon で設定ページへ遷移する', async () => {
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

  it('タブ間を遷移しながらレイアウトを維持する', async () => {
    const user = userEvent.setup()
    const router = createTestRouter('/training')
    render(<RouterProvider router={router} />)

    await screen.findByTestId('training-page')

    // Go to history
    await user.click(screen.getByText('履歴'))
    await screen.findByTestId('history-page')
    expect(screen.getByText('トレ')).toBeInTheDocument() // BottomNav still visible

    // Back to training
    await user.click(screen.getByText('トレ'))
    await screen.findByTestId('training-page')
  })
})
