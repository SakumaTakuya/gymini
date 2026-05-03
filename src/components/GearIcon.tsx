import { Link } from '@tanstack/react-router'
import { Gear } from '@phosphor-icons/react'
import { useSettingsStore } from '../stores/settingsStore'

export type GearIconVariant = 'overlay' | 'inline'

type Props = {
  className?: string
  variant?: GearIconVariant
}

const VARIANT_CLASS: Record<GearIconVariant, string> = {
  overlay:
    'bg-gym-white/80 backdrop-blur-sm shadow-float border border-gym-zinc-100',
  inline: 'hover:bg-gym-zinc-100/60',
}

export function GearIcon({ className = '', variant = 'inline' }: Props) {
  const hasApiKey = useSettingsStore((s) => s.hasApiKey)
  const variantClass = VARIANT_CLASS[variant]

  return (
    <Link
      to="/settings"
      aria-label="設定を開く"
      className={`focus-ring relative w-9 h-9 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full ${variantClass} ${className}`.trim()}
    >
      <Gear size={16} className="text-gym-zinc-500" />
      {!hasApiKey && (
        <span className="absolute top-[-2px] right-[-2px] w-3 h-3 bg-gym-accent rounded-full border-2 border-gym-white" />
      )}
    </Link>
  )
}
