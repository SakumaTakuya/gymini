import { render } from '@testing-library/react'
import {
  createRouter,
  createRootRoute,
  createRoute,
  createHashHistory,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'

export function renderWithRouter(
  ui: ReactNode,
  { initialPath = '/training' }: { initialPath?: string } = {},
) {
  const rootRoute = createRootRoute({
    component: () => (
      <div>
        <Outlet />
      </div>
    ),
  })

  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: initialPath,
    component: () => <>{ui}</>,
  })

  const routeTree = rootRoute.addChildren([testRoute])
  const hashHistory = createHashHistory()

  const router = createRouter({
    routeTree,
    history: hashHistory,
  })

  // Navigate to the initial path
  router.navigate({ to: initialPath })

  return render(<RouterProvider router={router} />)
}
