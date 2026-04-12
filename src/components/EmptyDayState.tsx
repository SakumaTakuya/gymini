import { Ghost, Plus } from '@phosphor-icons/react'
import type { DateString } from '../schemas/date'

interface EmptyDayStateProps {
  date: DateString
  onAddWorkout: (date: DateString) => void
}

function formatDateHeader(date: DateString): string {
  const [, m, d] = date.split('-').map(Number)
  return `${m}月${d}日の記録`
}

export function EmptyDayState({ date, onAddWorkout }: EmptyDayStateProps) {
  return (
    <>
      <div className="px-6 mb-3">
        <h3 className="font-jp font-bold text-sm text-gym-zinc-500">
          {formatDateHeader(date)}
        </h3>
      </div>

      <div
        data-testid="empty-day-state"
        className="mx-4 bg-transparent rounded-[24px] py-8 px-6 border-2 border-dashed border-gym-zinc-200 flex flex-col items-center justify-center gap-3"
      >
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-gym-zinc-300">
          <Ghost size={24} weight="duotone" />
        </div>
        <p className="text-xs font-bold text-gym-zinc-400 tracking-wider">
          記録なし
        </p>
        <button
          onClick={() => onAddWorkout(date)}
          className="mt-1 text-[10px] font-bold bg-white border border-gym-zinc-200 shadow-sm text-gym-black px-3 py-1.5 rounded-lg hover:bg-gym-zinc-50 transition-colors uppercase tracking-wider"
        >
          <Plus size={10} weight="bold" className="inline mr-1" />
          追加
        </button>
      </div>
    </>
  )
}
