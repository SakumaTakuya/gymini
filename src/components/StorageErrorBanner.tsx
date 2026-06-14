import { X } from '@phosphor-icons/react'
import { clearStorageError, type StorageErrorReason } from '../lib/storage'
import { useStorageError } from '../hooks/useStorageError'

const MESSAGES: Record<StorageErrorReason, string> = {
  quota:
    'ストレージの空き容量が不足しています。記録が保存されていない可能性があります。不要なデータを整理してください。',
  unavailable:
    'データを保存できませんでした。ブラウザの設定（プライベートモード等）で保存が無効になっている可能性があります。',
}

export function StorageErrorBanner() {
  const error = useStorageError()
  if (!error) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-50 flex items-start gap-3 border-b border-gym-accent/30 bg-gym-accent/10 backdrop-blur-xl px-4 py-3"
    >
      <p className="flex-1 text-sm leading-snug text-gym-black">
        {MESSAGES[error]}
      </p>
      <button
        type="button"
        aria-label="閉じる"
        onClick={clearStorageError}
        className="focus-ring flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gym-zinc-600 active:scale-95"
      >
        <X size={18} weight="bold" />
      </button>
    </div>
  )
}
