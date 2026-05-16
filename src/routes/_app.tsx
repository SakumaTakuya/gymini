import { createFileRoute, Outlet } from '@tanstack/react-router'
import { BottomNav } from '../components/BottomNav'
import { AppHeaderProvider } from '../components/AppHeaderContext'
import { useHydrated } from '../hooks/useHydrated'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const hydrated = useHydrated()

  if (!hydrated) {
    return <div className="min-h-screen bg-gym-zinc-50" />
  }

  return (
    <AppHeaderProvider>
      <main className="h-dvh flex flex-col pb-content-bottom">
        <Outlet />
      </main>
      <BottomNav />
    </AppHeaderProvider>
  )
}
