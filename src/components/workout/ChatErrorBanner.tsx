type ChatErrorBannerProps = {
  error: string
  /** When non-null, a retry button is rendered. The caller passes the chat-store
   *  value directly so the retry-ability invariant lives in one place. */
  lastFailedInput: string | null
  isLoading: boolean
  onRetry: () => void
}

export function ChatErrorBanner({
  error,
  lastFailedInput,
  isLoading,
  onRetry,
}: ChatErrorBannerProps) {
  const canRetry = lastFailedInput !== null
  return (
    <div
      role="alert"
      className="mx-4 my-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start justify-between gap-3"
    >
      <span className="flex-1">{error}</span>
      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isLoading}
          className="focus-ring shrink-0 h-9 px-3 rounded-lg bg-gym-black text-gym-white text-xs font-semibold disabled:opacity-50"
        >
          再送
        </button>
      )}
    </div>
  )
}
