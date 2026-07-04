import { createFileRoute, Outlet } from '@tanstack/react-router'
import { BottomNav } from '../components/BottomNav'
import { AppHeaderProvider } from '../components/AppHeaderContext'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <AppHeaderProvider>
      <main className="h-dvh flex flex-col pb-content-bottom">
        <Outlet />
      </main>
      <BottomNav />
    </AppHeaderProvider>
  )
}
