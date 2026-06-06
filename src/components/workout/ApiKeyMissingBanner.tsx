import { Link } from '@tanstack/react-router'
import { SignIn } from '@phosphor-icons/react'
import { useSettingsStore } from '@/stores/settingsStore'

export function ApiKeyMissingBanner() {
  const hasApiKey = useSettingsStore((s) => s.hasApiKey)
  if (hasApiKey) return null
  return (
    <div className="mx-4 my-4 rounded-2xl bg-gym-white border border-gym-zinc-200 shadow-soft p-4 text-sm">
      <p className="font-semibold mb-2">APIキーが必要です</p>
      <p className="text-gym-zinc-600 mb-3">
        Gemini APIキーを設定するとチャットが利用できます。
      </p>
      <Link
        to="/settings"
        className="focus-ring inline-flex items-center gap-1.5 h-11 px-4 rounded-xl bg-gym-black text-gym-white font-semibold"
      >
        <SignIn size={16} weight="bold" />
        設定画面へ
      </Link>
    </div>
  )
}
