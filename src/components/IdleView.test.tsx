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
import { IdleView } from './IdleView'
import { useSettingsStore } from '../stores/settingsStore'

function renderIdleView(onStartTraining: () => void = vi.fn()) {
  useSettingsStore.setState({ apiKey: '', hasApiKey: false })
  const rootRoute = createRootRoute({
    component: () => (
      <div style={{ position: 'relative' }}>
        <Outlet />
      </div>
    ),
  })
  const trainingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/training',
    component: () => <IdleView onStartTraining={onStartTraining} />,
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

describe('IdleView', () => {
  it('トレーニング開始ボタンを描画する', async () => {
    renderIdleView()
    expect(
      await screen.findByRole('button', { name: /トレーニングを始める/ }),
    ).toBeInTheDocument()
  })

  it('ボタンクリック時にonStartTrainingを呼び出す', async () => {
    const onStartTraining = vi.fn()
    renderIdleView(onStartTraining)
    fireEvent.click(
      await screen.findByRole('button', { name: /トレーニングを始める/ }),
    )
    expect(onStartTraining).toHaveBeenCalledOnce()
  })

  it('ボタンがタップターゲットとして適切なサイズを持つ', async () => {
    renderIdleView()
    const button = await screen.findByRole('button', {
      name: /トレーニングを始める/,
    })
    expect(button.className).toContain('h-13')
  })
})
