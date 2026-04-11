import { createRootRoute, Outlet, Navigate } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-zinc-50">
      <Outlet />
    </div>
  ),
  notFoundComponent: () => <Navigate to="/training" />,
})
