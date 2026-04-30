import { useRouter, useCanGoBack } from '@tanstack/react-router'
import { X } from '@phosphor-icons/react'
import { AppHeader } from '../components/AppHeader'
import { SettingsContent } from '../components/settings/SettingsContent'

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
    <div className="min-h-screen bg-zinc-50">
      <AppHeader
        title="設定"
        variant="modal"
        trailing={
          <button
            type="button"
            onClick={handleClose}
            aria-label="閉じる"
            className="focus-ring w-9 h-9 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-zinc-100/60"
          >
            <X size={16} weight="bold" className="text-zinc-500" />
          </button>
        }
      />
      <SettingsContent />
    </div>
  )
}
