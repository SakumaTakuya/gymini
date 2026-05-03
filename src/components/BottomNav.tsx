import { Link } from '@tanstack/react-router'
import { Barbell, ClockCounterClockwise, Robot } from '@phosphor-icons/react'

const NAV_TABS = [
  {
    to: '/training' as const,
    label: 'トレ',
    icon: <Barbell size={24} />,
    activeIcon: <Barbell size={24} weight="fill" />,
  },
  {
    to: '/history' as const,
    label: '履歴',
    icon: <ClockCounterClockwise size={24} />,
    activeIcon: <ClockCounterClockwise size={24} weight="fill" />,
  },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full h-24 bg-gym-white/80 backdrop-blur-xl border-t border-gym-zinc-200/50 flex items-start pt-3 px-4 z-40">
      {NAV_TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className="flex-1 flex items-center justify-center min-h-[44px] min-w-[44px]"
        >
          {({ isActive }) => (
            <span
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-colors ${
                isActive
                  ? 'bg-gym-zinc-100 text-gym-black'
                  : 'text-gym-zinc-400'
              }`}
            >
              {isActive ? tab.activeIcon : tab.icon}
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </span>
          )}
        </Link>
      ))}
      <Link
        to="/ai"
        className="flex items-center justify-center min-h-[44px] min-w-[44px] ml-1"
        activeProps={{ className: 'flex items-center justify-center min-h-[44px] min-w-[44px] ml-1' }}
      >
        {({ isActive }) => (
          <span
            className={`flex items-center gap-1.5 px-4 h-11 rounded-2xl transition-colors ${
              isActive
                ? 'bg-gym-accent text-gym-white shadow-lg shadow-red-200'
                : 'bg-gym-black text-gym-white border border-gym-zinc-800'
            }`}
          >
            <Robot size={20} weight="bold" />
            <span className="text-xs font-bold">AI</span>
          </span>
        )}
      </Link>
    </nav>
  )
}
