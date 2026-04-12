import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
import * as WorkoutRepository from '../lib/workoutRepository'
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

  const routeTree = rootRoute.addChildren([historyRoute])

  const searchStr = new URLSearchParams(searchParams).toString()
  const memoryHistory = createMemoryHistory({
    initialEntries: [`/history${searchStr ? `?${searchStr}` : ''}`],
  })

  const router = createRouter({ routeTree, history: memoryHistory })

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  )

  return { queryClient, router }
}

describe('HistoryPage integration', () => {
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

  it('shows calendar with navigation buttons', async () => {
    renderWithRouter()
    expect(await screen.findByLabelText('前月')).toBeInTheDocument()
    expect(screen.getByLabelText('次月')).toBeInTheDocument()
  })

  it('shows empty state when no workouts exist', async () => {
    renderWithRouter()
    expect(await screen.findByTestId('empty-day-state')).toBeInTheDocument()
    expect(screen.getByText('記録なし')).toBeInTheDocument()
  })

  it('shows workout summary when workouts exist for selected date', async () => {
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

  it('respects month search param', async () => {
    renderWithRouter({ month: '2026-03' })
    const header = await screen.findByRole('heading', { level: 2 })
    expect(header.textContent).toContain('2026')
    expect(header.textContent).toContain('3')
  })
})
