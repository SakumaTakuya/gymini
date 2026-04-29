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
      <div style={{ position: 'relative' }}>
        <Outlet />
      </div>
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

  it('shows IdleView with gear when session is not active', async () => {
    renderTrainingPage()
    expect(
      await screen.findByRole('button', { name: /トレーニングを始める/ }),
    ).toBeInTheDocument()
    const link = await screen.findByRole('link')
    expect(link.getAttribute('href')).toContain('settings')
  })

  it('shows ActiveSessionView with SessionHeader chrome when session is active', async () => {
    useWorkoutSessionStore.getState().startSession()
    renderTrainingPage()
    expect(await screen.findByText('ワークアウト')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('種目を追加...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '終了' })).toBeInTheDocument()
    expect(screen.getByText('00:00:00')).toBeInTheDocument()
  })

  it('transitions from IdleView to ActiveSessionView on button click', async () => {
    renderTrainingPage()
    fireEvent.click(
      await screen.findByRole('button', { name: /トレーニングを始める/ }),
    )
    expect(await screen.findByText('ワークアウト')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '終了' })).toBeInTheDocument()
  })

  it('clicking 終了 ends the session and returns to IdleView', async () => {
    useWorkoutSessionStore.getState().startSession()
    renderTrainingPage()
    fireEvent.click(await screen.findByRole('button', { name: '終了' }))
    expect(useWorkoutSessionStore.getState().isActive).toBe(false)
    expect(
      await screen.findByRole('button', { name: /トレーニングを始める/ }),
    ).toBeInTheDocument()
  })

  it('shows elapsed time when session has been running', async () => {
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
