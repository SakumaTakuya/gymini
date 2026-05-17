import { Clock } from '@phosphor-icons/react'
import { formatElapsedTime } from '@/lib/formatElapsedTime'

type Props = {
  elapsedSeconds: number
}

export function TimerPill({ elapsedSeconds }: Props) {
  return (
    <div className="flex items-center gap-1 bg-gym-white/80 backdrop-blur-sm shadow-float border border-gym-zinc-100 px-2 py-1 rounded-lg">
      <Clock weight="fill" size={12} className="text-gym-accent" />
      <span className="font-outfit font-bold text-xs text-gym-zinc-900 tabular-nums">
        {formatElapsedTime(elapsedSeconds)}
      </span>
    </div>
  )
}
