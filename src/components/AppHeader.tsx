import type { ReactNode } from 'react'

export type AppHeaderVariant = 'default' | 'session-active' | 'modal'

export type AppHeaderProps = {
  title: string
  leading?: ReactNode
  trailing?: ReactNode
  className?: string
}

// Standalone floating-pill header for pages outside the AppHeaderProvider
// portal system (currently SettingsPage only). Positioning must stay in sync
// with the provider header: top-header-top = safe-area-inset-top + 12px.
export function AppHeader({
  title,
  leading,
  trailing,
  className = '',
}: AppHeaderProps) {
  return (
    <header
      role="banner"
      className={`fixed top-header-top left-4 right-4 z-30 rounded-full flex items-center h-11 bg-gym-white/80 backdrop-blur-xl border border-gym-zinc-200/60 shadow-float px-3 justify-between ${className}`.trim()}
    >
      <div className="flex items-center gap-2 min-w-0">
        {leading}
        <h1 className="font-outfit font-bold text-base text-gym-zinc-900 truncate">
          {title}
        </h1>
      </div>
      {trailing && (
        <div className="flex items-center gap-2 shrink-0">{trailing}</div>
      )}
    </header>
  )
}
