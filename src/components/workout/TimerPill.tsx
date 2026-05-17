import { Clock } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { formatElapsedTime } from '@/lib/formatElapsedTime'

const BREATH_DURATION_MS = 1500

type Props = {
  elapsedSeconds: number
}

export function TimerPill({ elapsedSeconds }: Props) {
  const [breathing, setBreathing] = useState(false)

  useEffect(() => {
    if (elapsedSeconds === 0 || elapsedSeconds % 60 !== 0) return
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }
    const start = setTimeout(() => setBreathing(true), 0)
    const stop = setTimeout(() => setBreathing(false), BREATH_DURATION_MS)
    return () => {
      clearTimeout(start)
      clearTimeout(stop)
    }
  }, [elapsedSeconds])

  return (
    <div
      className={`flex items-center gap-1 bg-gym-white/80 backdrop-blur-sm shadow-float border border-gym-zinc-100 px-2 py-1 rounded-lg ${
        breathing ? 'animate-breath' : ''
      }`}
    >
      <Clock weight="fill" size={12} className="text-gym-accent" />
      <span className="font-outfit font-bold text-xs text-gym-zinc-900 tabular-nums">
        {formatElapsedTime(elapsedSeconds)}
      </span>
    </div>
  )
}
