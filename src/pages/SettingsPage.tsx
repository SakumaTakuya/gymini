import { useRouter, useCanGoBack } from '@tanstack/react-router'
import { X } from '@phosphor-icons/react'
import { AppHeader } from '../components/AppHeader'
import { IconButton } from '../components/ui/icon-button'
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
    <div className="min-h-screen bg-gym-zinc-50 pt-content-top">
      <AppHeader
        title="設定"
        trailing={
          <IconButton
            onClick={handleClose}
            aria-label="閉じる"
            className="rounded-full hover:bg-gym-zinc-100/60 text-gym-zinc-500"
          >
            <X size={16} weight="bold" />
          </IconButton>
        }
      />
      <SettingsContent />
    </div>
  )
}
