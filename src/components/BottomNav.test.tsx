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

  const routeTree = rootRoute.addChildren([trainingRoute, historyRoute])
  const hashHistory = createHashHistory()

  const router = createRouter({
    routeTree,
    history: hashHistory,
  })

  router.navigate({ to: initialPath })

  return render(<RouterProvider router={router} />)
}

describe('BottomNav', () => {
  it('2 つのナビゲーションタブ（トレ / 履歴）を描画する', async () => {
    renderBottomNav()
    expect(await screen.findByText('トレ')).toBeInTheDocument()
    expect(screen.getByText('履歴')).toBeInTheDocument()
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })

  it('2 つのナビゲーションリンクを持つ', async () => {
    renderBottomNav()
    await screen.findByText('トレ')
    const links = screen.getAllByRole('link')
    expect(links.length).toBe(2)
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
