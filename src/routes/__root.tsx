import { useEffect } from 'react'
import { createRootRoute, Outlet, Navigate } from '@tanstack/react-router'
import { useSettingsStore } from '../stores/settingsStore'

function RootLayout() {
  const loadApiKey = useSettingsStore((s) => s.loadApiKey)

  useEffect(() => {
    loadApiKey()
  }, [loadApiKey])

  return (
    <div className="min-h-screen bg-zinc-50">
      <Outlet />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <Navigate to="/training" />,
})
