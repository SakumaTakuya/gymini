import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  createRouter,
  createRootRoute,
  createRoute,
  createHashHistory,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import { BottomNav } from './BottomNav'

function renderBottomNav(initialPath = '/training') {
  const rootRoute = createRootRoute({
    component: () => (
      <div>
        <BottomNav />
        <Outlet />
      </div>
    ),
  })

  const trainingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/training',
    component: () => <div>Training Page</div>,
  })

  const historyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/history',
    component: () => <div>History Page</div>,
  })

  const aiRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/ai',
    component: () => <div>AI Page</div>,
  })

  const routeTree = rootRoute.addChildren([trainingRoute, historyRoute, aiRoute])
  const hashHistory = createHashHistory()

  const router = createRouter({
    routeTree,
    history: hashHistory,
  })

  router.navigate({ to: initialPath })

  return render(<RouterProvider router={router} />)
}

describe('BottomNav', () => {
  it('3つのナビゲーション項目（タブ2つ＋AIボタン）を描画する', async () => {
    renderBottomNav()
    expect(await screen.findByText('トレ')).toBeInTheDocument()
    expect(screen.getByText('履歴')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('ナビゲーションリンクを持つ', async () => {
    renderBottomNav()
    await screen.findByText('トレ')
    const links = screen.getAllByRole('link')
    expect(links.length).toBe(3)
  })

  it('アクセシブルなタップターゲット（最小44px）を持つ', async () => {
    renderBottomNav()
    await screen.findByText('トレ')
    const links = screen.getAllByRole('link')
    links.forEach((link) => {
      const classList = link.className
      expect(classList).toContain('min-h-[44px]')
      expect(classList).toContain('min-w-[44px]')
    })
  })
})
