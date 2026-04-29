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
  variant = 'default',
  sticky = true,
  className = '',
}: AppHeaderProps) {
  const stickyClass = sticky ? 'sticky' : 'relative'
  const heightClass = APP_HEADER_VARIANT_HEIGHT[variant]

  return (
    <header
      role="banner"
      data-variant={variant}
      className={`${stickyClass} top-0 z-30 px-4 ${heightClass} flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-zinc-200/60 ${className}`.trim()}
    >
      <div className="flex items-center gap-2 min-w-0">
        {leading}
        <h1 className="font-outfit font-bold text-base text-zinc-900 truncate">
          {title}
        </h1>
      </div>
      {trailing && (
        <div className="flex items-center gap-2 shrink-0">{trailing}</div>
      )}
    </header>
  )
}
