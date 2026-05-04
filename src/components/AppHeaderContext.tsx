import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { type AppHeaderVariant } from './AppHeader'

type ContextValue = {
  setTitleHost: (el: HTMLElement | null) => void
  setLeadingHost: (el: HTMLElement | null) => void
  setTrailingHost: (el: HTMLElement | null) => void
  titleHost: HTMLElement | null
  leadingHost: HTMLElement | null
  trailingHost: HTMLElement | null
  variant: AppHeaderVariant
  setVariant: (v: AppHeaderVariant) => void
  showLeftPill: boolean
  setShowLeftPill: (v: boolean) => void
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
  const [showLeftPill, setShowLeftPill] = useState(false)

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
      showLeftPill,
      setShowLeftPill,
    }),
    [titleHost, leadingHost, trailingHost, variant, showLeftPill],
  )

  return (
    <AppHeaderContext.Provider value={value}>
      <header
        role="banner"
        data-variant={variant}
        className="fixed top-0 left-0 right-0 z-30 pointer-events-none px-4 pt-3 flex items-start justify-between"
      >
        <>
          {showLeftPill && (
            <div className="flex items-center gap-2 rounded-full bg-gym-white/80 backdrop-blur-xl border border-gym-zinc-200/60 shadow-float px-3 h-11 pointer-events-auto">
              <span ref={setLeadingHost} className="contents" />
              <h1
                ref={setTitleHost}
                className="font-outfit font-bold text-base text-gym-zinc-900 truncate max-w-[180px]"
              />
            </div>
          )}
          <div
            ref={setTrailingHost}
            className="ml-auto flex items-center gap-2 pointer-events-auto"
          />
        </>
      </header>
      {children}
    </AppHeaderContext.Provider>
  )
}

type AppHeaderContentProps = {
  title?: string
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

  useEffect(() => {
    ctx.setShowLeftPill(!!leading || !!title)
    return () => {
      ctx.setShowLeftPill(false)
    }
  }, [ctx, leading, title])

  return (
    <>
      {title != null && ctx.titleHost && createPortal(title, ctx.titleHost)}
      {leading != null && ctx.leadingHost
        ? createPortal(leading, ctx.leadingHost)
        : null}
      {trailing != null && ctx.trailingHost
        ? createPortal(trailing, ctx.trailingHost)
        : null}
    </>
  )
}
