type ErrorFallbackProps = {
  error: Error
}

export function ErrorFallback({ error }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-gym-zinc-50"
    >
      <h1 className="font-outfit text-xl font-bold text-gym-black">
        エラーが発生しました
      </h1>
      <p className="max-w-xs text-sm text-gym-zinc-600">
        {error.message || '予期しないエラーが発生しました。'}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="focus-ring min-h-[44px] rounded-full bg-gym-black px-6 font-semibold text-gym-white active:scale-95"
      >
        再読み込み
      </button>
    </div>
  )
}
