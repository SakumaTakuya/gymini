import { createFileRoute, Outlet } from '@tanstack/react-router'
import { BottomNav } from '../components/BottomNav'
import { useHydrated } from '../hooks/useHydrated'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const hydrated = useHydrated()

  if (!hydrated) {
    return <div className="min-h-screen bg-zinc-50" />
  }

  return (
    <>
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </>
  )
}
