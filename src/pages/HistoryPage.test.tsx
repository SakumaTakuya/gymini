import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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
import { z } from 'zod'
import { dateStringSchema } from '../schemas/date'
import { HistoryPage } from './HistoryPage'
import { AppHeaderProvider } from '../components/AppHeaderContext'
import * as WorkoutRepository from '../lib/workoutRepository'
import * as ExerciseRepository from '../lib/exerciseRepository'
import type { DateString } from '../schemas/date'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'

function renderWithRouter(searchParams: Record<string, string> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const historySearchSchema = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    date: dateStringSchema.optional(),
  })

  const rootRoute = createRootRoute({ component: () => <Outlet /> })

  const historyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/history',
    validateSearch: historySearchSchema,
    component: HistoryPage,
  })

  const trainingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/training',
    component: () => <div>トレーニング画面</div>,
  })

  const routeTree = rootRoute.addChildren([historyRoute, trainingRoute])

  const searchStr = new URLSearchParams(searchParams).toString()
  const memoryHistory = createMemoryHistory({
    initialEntries: [`/history${searchStr ? `?${searchStr}` : ''}`],
  })

  const router = createRouter({ routeTree, history: memoryHistory })

  render(
    <QueryClientProvider client={queryClient}>
      <AppHeaderProvider>
        <RouterProvider router={router as never} />
      </AppHeaderProvider>
    </QueryClientProvider>,
  )

  return { queryClient, router }
}

describe('HistoryPage インテグレーション', () => {
  beforeEach(() => {
    localStorage.clear()
    useWorkoutSessionStore.setState({
      isActive: false,
      startedAt: null,
      date: null,
      draftExercises: [],
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('ナビゲーションボタン付きのカレンダーを表示する', async () => {
    renderWithRouter()
    expect(await screen.findByLabelText('前月')).toBeInTheDocument()
    expect(screen.getByLabelText('次月')).toBeInTheDocument()
  })

  it('ワークアウトが存在しない場合は空状態を表示する', async () => {
    renderWithRouter()
    expect(await screen.findByTestId('empty-day-state')).toBeInTheDocument()
    expect(screen.getByText('記録なし')).toBeInTheDocument()
  })

  it('選択した日付のワークアウトが存在する場合はサマリーを表示する', async () => {
    WorkoutRepository.save({
      date: '2026-04-12' as DateString,
      exercises: [
        {
          exerciseId: 'e1',
          exerciseName: 'Bench Press',
          sets: [{ weight: 100, reps: 10 }],
        },
      ],
      startedAt: '2026-04-12T10:00:00.000Z' as never,
      endedAt: '2026-04-12T11:00:00.000Z' as never,
    })

    renderWithRouter({ date: '2026-04-12' })
    expect(await screen.findByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('4月12日の記録')).toBeInTheDocument()
  })

  it('monthクエリパラメーターを反映する', async () => {
    renderWithRouter({ month: '2026-03' })
    const header = await screen.findByRole('heading', { level: 2 })
    expect(header.textContent).toContain('2026')
    expect(header.textContent).toContain('3')
  })

  it('設定へのギアリンクを描画する', async () => {
    renderWithRouter()
    await screen.findByLabelText('前月')
    const settingsLink = screen
      .getAllByRole('link')
      .find((l) => l.getAttribute('href')?.includes('settings'))
    expect(settingsLink).toBeDefined()
  })

  it('種目の部位に応じた色ドットと凡例を表示する', async () => {
    const bench = ExerciseRepository.create('ベンチプレス', 'chest')
    WorkoutRepository.save({
      date: '2026-04-12' as DateString,
      exercises: [
        {
          exerciseId: bench.id,
          exerciseName: 'ベンチプレス',
          sets: [{ weight: 100, reps: 10 }],
        },
      ],
      startedAt: '2026-04-12T10:00:00.000Z' as never,
      endedAt: '2026-04-12T11:00:00.000Z' as never,
    })

    renderWithRouter({ month: '2026-04', date: '2026-04-12' })

    const marker = await screen.findByTestId('workout-marker')
    expect(marker.style.backgroundColor).toBe('rgb(222, 58, 43)')

    const legend = screen.getByTestId('calendar-legend')
    expect(legend.textContent).toContain('胸')
  })

  it('"追加"クリック時にセッションを開始してトレーニング画面に遷移する', async () => {
    const user = userEvent.setup()
    const { router } = renderWithRouter()
    await screen.findByTestId('empty-day-state')
    await user.click(screen.getByRole('button', { name: '追加' }))
    expect(useWorkoutSessionStore.getState().isActive).toBe(true)
    expect(router.state.location.pathname).toBe('/training')
  })
})
