import { useState } from 'react'
import { Dumbbell, Calendar, Settings } from 'lucide-react'
import type { Route } from '../types'
import useNavigation from '../hooks/useNavigation'
import useWorkoutSession from '../hooks/useWorkoutSession'
import FAB from './FAB'
import AddExerciseModal from './AddExerciseModal'

interface NavTab {
  route: Route
  label: string
  icon: React.ReactNode
}

const NAV_TABS: NavTab[] = [
  { route: 'training', label: 'Training', icon: <Dumbbell size={20} /> },
  { route: 'history', label: 'History', icon: <Calendar size={20} /> },
  { route: 'exercise-master', label: 'Settings', icon: <Settings size={20} /> },
]

export default function BottomNav() {
  const { currentRoute, navigate } = useNavigation()
  const { isActive } = useWorkoutSession()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <nav className="h-[83px] bg-white border-t border-zinc-100 px-5 pt-3 flex items-start">
        <div className="flex items-center justify-start gap-2">
          {NAV_TABS.map((tab) => {
            const active = currentRoute === tab.route
            return (
              <button
                key={tab.route}
                className={[
                  'min-h-[44px] min-w-[44px] flex flex-col items-center justify-center px-4 gap-0.5',
                  'font-outfit text-xs',
                  active ? 'text-black font-bold' : 'text-zinc-400 font-normal',
                ].join(' ')}
                onClick={() => navigate(tab.route)}
                aria-label={tab.label}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex items-center pt-0.5">
          <FAB visible={isActive} onClick={() => setModalOpen(true)} />
        </div>
      </nav>

      <AddExerciseModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
