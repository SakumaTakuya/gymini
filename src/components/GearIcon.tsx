import { Link } from '@tanstack/react-router'
import { Gear } from '@phosphor-icons/react'
import { useSettingsStore } from '../stores/settingsStore'

type Props = {
  className?: string
}

export function GearIcon({ className = '' }: Props) {
  const hasApiKey = useSettingsStore((s) => s.hasApiKey)

  return (
    <Link
      to="/settings"
      className={`relative w-9 h-9 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-zinc-100 ${className}`.trim()}
    >
      <Gear size={16} className="text-zinc-500" />
      {!hasApiKey && (
        <span className="absolute top-[-2px] right-[-2px] w-3 h-3 bg-accent rounded-full border-2 border-white" />
      )}
    </Link>
  )
}
