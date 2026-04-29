import { Clock } from '@phosphor-icons/react'
import { formatElapsedTime } from '@/lib/formatElapsedTime'

type Props = {
  elapsedSeconds: number
}

export function TimerPill({ elapsedSeconds }: Props) {
  return (
    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm shadow-sm border border-zinc-100 px-2 py-1 rounded-lg">
      <Clock weight="fill" size={12} className="text-accent animate-pulse" />
      <span className="font-outfit font-bold text-xs text-zinc-900">
        {formatElapsedTime(elapsedSeconds)}
      </span>
    </div>
  )
}
