import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { APP_HEADER_VARIANT_HEIGHT, type AppHeaderVariant } from './AppHeader'

type ContextValue = {
  setTitleHost: (el: HTMLElement | null) => void
  setLeadingHost: (el: HTMLElement | null) => void
  setTrailingHost: (el: HTMLElement | null) => void
  titleHost: HTMLElement | null
  leadingHost: HTMLElement | null
  trailingHost: HTMLElement | null
  variant: AppHeaderVariant
  setVariant: (v: AppHeaderVariant) => void
}

const AppHeaderContext = createContext<ContextValue | null>(null)

type ProviderProps = {
  children: ReactNode
}

export function AppHeaderProvider({ children }: ProviderProps) {
  const [titleHost, setTitleHost] = useState<HTMLElement | null>(null)
  const [leadingHost, setLeadingHost] = useState<HTMLElement | null>(null)
  const [trailingHost, setTrailingHost] = useState<HTMLElement | null>(null)
  const [variant, setVariant] = useState<AppHeaderVariant>('default')

  const value = useMemo<ContextValue>(
    () => ({
      setTitleHost,
      setLeadingHost,
      setTrailingHost,
      titleHost,
      leadingHost,
      trailingHost,
      variant,
      setVariant,
    }),
    [titleHost, leadingHost, trailingHost, variant],
  )

  const heightClass = APP_HEADER_VARIANT_HEIGHT[variant]

  return (
    <AppHeaderContext.Provider value={value}>
      <header
        role="banner"
        data-variant={variant}
        className={`sticky top-0 z-30 px-4 ${heightClass} flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-zinc-200/60`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span ref={setLeadingHost} className="contents" />
          <h1
            ref={setTitleHost}
            className="font-outfit font-bold text-base text-zinc-900 truncate"
          />
        </div>
        <div
          ref={setTrailingHost}
          className="flex items-center gap-2 shrink-0"
        />
      </header>
      {children}
    </AppHeaderContext.Provider>
  )
}

type AppHeaderContentProps = {
  title: string
  leading?: ReactNode
  trailing?: ReactNode
  variant?: AppHeaderVariant
}

export function AppHeaderContent({
  title,
  leading,
  trailing,
  variant = 'default',
}: AppHeaderContentProps) {
  const ctx = useContext(AppHeaderContext)
  if (!ctx) {
    throw new Error(
      '<AppHeaderContent> must be rendered inside <AppHeaderProvider>',
    )
  }

  useEffect(() => {
    ctx.setVariant(variant)
    return () => {
      ctx.setVariant('default')
    }
  }, [ctx, variant])

  return (
    <>
      {ctx.titleHost && createPortal(title, ctx.titleHost)}
      {leading != null && ctx.leadingHost
        ? createPortal(leading, ctx.leadingHost)
        : null}
      {trailing != null && ctx.trailingHost
        ? createPortal(trailing, ctx.trailingHost)
        : null}
    </>
  )
}
