import { useRouter, useCanGoBack } from '@tanstack/react-router'
import { X } from '@phosphor-icons/react'

export function SettingsPage() {
  const router = useRouter()
  const canGoBack = useCanGoBack()

  const handleClose = () => {
    if (canGoBack) {
      router.history.back()
    } else {
      router.navigate({ to: '/training' })
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 relative">
      <button
        onClick={handleClose}
        className="absolute top-12 right-4 z-30 w-9 h-9 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-zinc-100"
        aria-label="閉じる"
      >
        <X size={16} weight="bold" className="text-zinc-500" />
      </button>
      <div className="p-4 pt-24">
        <h1 className="text-xl font-bold">設定</h1>
        <p className="text-zinc-500 mt-2">設定ページ（プレースホルダー）</p>
      </div>
    </div>
  )
}
