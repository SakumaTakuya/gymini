import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import { SettingsPage } from './SettingsPage'
import { AppHeaderProvider } from '../components/AppHeaderContext'

function renderWithRouter(initialEntries: string[], initialIndex = 0) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const trainingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/training',
    component: () => <div>トレーニング画面</div>,
  })
  const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: SettingsPage,
  })

  const routeTree = rootRoute.addChildren([trainingRoute, settingsRoute])
  const memoryHistory = createMemoryHistory({ initialEntries, initialIndex })
  const router = createRouter({ routeTree, history: memoryHistory })

  render(
    <QueryClientProvider client={queryClient}>
      <AppHeaderProvider>
        <RouterProvider router={router as never} />
      </AppHeaderProvider>
    </QueryClientProvider>,
  )

  return { router }
}

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('"設定" ページタイトルを表示する', async () => {
    renderWithRouter(['/settings'])
    expect(await screen.findByText('設定')).toBeInTheDocument()
  })

  it('"閉じる" ボタンを表示する', async () => {
    renderWithRouter(['/settings'])
    expect(await screen.findByRole('button', { name: '閉じる' })).toBeInTheDocument()
  })

  it('SettingsContent を描画する（Gemini API セクションが見える）', async () => {
    renderWithRouter(['/settings'])
    expect(await screen.findByText('Gemini API')).toBeInTheDocument()
  })

  it('canGoBack が false の場合、/training にナビゲートする', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(['/settings'])
    await screen.findByRole('button', { name: '閉じる' })
    await user.click(screen.getByRole('button', { name: '閉じる' }))
    expect(router.state.location.pathname).toBe('/training')
  })

  it('canGoBack が true の場合、前の画面に戻る', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter(['/training', '/settings'], 1)
    await screen.findByRole('button', { name: '閉じる' })
    await user.click(screen.getByRole('button', { name: '閉じる' }))
    expect(router.state.location.pathname).toBe('/training')
  })
})
