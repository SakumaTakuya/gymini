import { Clock } from '@phosphor-icons/react'
import { GearIcon } from '../GearIcon'
import { formatElapsedTime } from '@/lib/formatElapsedTime'

type Props = {
  elapsedSeconds: number
  onEndSession: () => void
}

export function SessionHeader({ elapsedSeconds, onEndSession }: Props) {
  return (
    <div className="absolute top-12 right-4 z-30 flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <GearIcon />
        <button
          type="button"
          onClick={onEndSession}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-accent text-sm font-bold bg-red-50/90 backdrop-blur-sm shadow-sm px-3 py-1.5 rounded-lg focus-ring"
        >
          終了
        </button>
      </div>
      <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm shadow-sm border border-zinc-100 px-2 py-1 rounded-lg">
        <Clock weight="fill" size={12} className="text-accent animate-pulse" />
        <span className="font-outfit font-bold text-xs text-zinc-900">
          {formatElapsedTime(elapsedSeconds)}
        </span>
      </div>
    </div>
  )
}
