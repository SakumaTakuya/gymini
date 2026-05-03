import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  createRouter,
  createRootRoute,
  createRoute,
  createHashHistory,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import { TrainingPage } from './TrainingPage'
import { AppHeaderProvider } from '../components/AppHeaderContext'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { DateString, ISODateTimeString } from '../schemas/date'

function resetStore() {
  useWorkoutSessionStore.setState({
    isActive: false,
    startedAt: null,
    date: null,
    draftExercises: [],
  })
  useSettingsStore.setState({ apiKey: '', hasApiKey: false })
}

function renderTrainingPage() {
  const rootRoute = createRootRoute({
    component: () => (
      <AppHeaderProvider>
        <Outlet />
      </AppHeaderProvider>
    ),
  })
  const trainingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/training',
    component: TrainingPage,
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

describe('TrainingPage', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
  })

  it('セッション未開始のときギア付きのIdleViewを表示する', async () => {
    renderTrainingPage()
    expect(
      await screen.findByRole('button', { name: /トレーニングを始める/ }),
    ).toBeInTheDocument()
    const link = await screen.findByRole('link')
    expect(link.getAttribute('href')).toContain('settings')
  })

  it('セッション中はSessionHeaderのUIとともにActiveSessionViewを表示する', async () => {
    useWorkoutSessionStore.getState().startSession()
    renderTrainingPage()
    expect(await screen.findByPlaceholderText('種目を追加...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '終了' })).toBeInTheDocument()
    expect(screen.getByText('00:00:00')).toBeInTheDocument()
  })

  it('ボタンクリックでIdleViewからActiveSessionViewに遷移する', async () => {
    renderTrainingPage()
    fireEvent.click(
      await screen.findByRole('button', { name: /トレーニングを始める/ }),
    )
    expect(await screen.findByRole('button', { name: '終了' })).toBeInTheDocument()
  })

  it('終了クリックでセッションを終了してIdleViewに戻る', async () => {
    useWorkoutSessionStore.getState().startSession()
    renderTrainingPage()
    fireEvent.click(await screen.findByRole('button', { name: '終了' }))
    expect(useWorkoutSessionStore.getState().isActive).toBe(false)
    expect(
      await screen.findByRole('button', { name: /トレーニングを始める/ }),
    ).toBeInTheDocument()
  })

  it('セッション実行中は経過時間を表示する', async () => {
    const startedAt = new Date(Date.now() - (14 * 60 + 32) * 1000).toISOString()
    useWorkoutSessionStore.setState({
      isActive: true,
      startedAt: startedAt as ISODateTimeString,
      date: '2026-03-08' as DateString,
      draftExercises: [],
    })
    renderTrainingPage()
    expect(await screen.findByText(/^00:14:3[12]$/)).toBeInTheDocument()
  })
})
