import { createFileRoute, Outlet } from '@tanstack/react-router'
import { GearIcon } from '../components/GearIcon'
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
      <GearIcon />
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </>
  )
}
