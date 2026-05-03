import type { ReactNode } from 'react'

export type AppHeaderVariant = 'default' | 'session-active' | 'modal'

export type AppHeaderProps = {
  title: string
  leading?: ReactNode
  trailing?: ReactNode
  variant?: AppHeaderVariant
  sticky?: boolean
  className?: string
}

// Kept for backward compatibility — no longer used internally
// eslint-disable-next-line react-refresh/only-export-components
export const APP_HEADER_VARIANT_HEIGHT: Record<AppHeaderVariant, string> = {
  default: 'h-14',
  'session-active': 'min-h-14 py-2',
  modal: 'h-14',
}

export function AppHeader({
  title,
  leading,
  trailing,
  className = '',
}: AppHeaderProps) {
  return (
    <header
      role="banner"
      className={`fixed top-3 left-4 right-4 z-30 rounded-full flex items-center h-11 bg-gym-white/80 backdrop-blur-xl border border-gym-zinc-200/60 shadow-float px-3 justify-between ${className}`.trim()}
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
