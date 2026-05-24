import { useEffect } from 'react'
import { createRootRoute, Outlet, Navigate } from '@tanstack/react-router'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserProfileStore } from '../stores/userProfileStore'
import { StorageErrorBanner } from '../components/StorageErrorBanner'

function RootLayout() {
  const loadApiKey = useSettingsStore((s) => s.loadApiKey)
  const loadProfile = useUserProfileStore((s) => s.loadProfile)

  useEffect(() => {
    loadApiKey()
    loadProfile()
  }, [loadApiKey, loadProfile])

  return (
    <div className="min-h-screen bg-gym-zinc-50">
      <StorageErrorBanner />
      <Outlet />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <Navigate to="/training" />,
})
