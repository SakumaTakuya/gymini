import { Ghost, Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { formatDateHeader } from '../lib/dateFormat'
import type { DateString } from '../schemas/date'

interface EmptyDayStateProps {
  date: DateString
  onAddWorkout: (date: DateString) => void
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
        <div className="w-12 h-12 bg-gym-white rounded-full flex items-center justify-center shadow-soft text-gym-zinc-300">
          <Ghost size={24} weight="duotone" />
        </div>
        <p className="text-xs font-bold text-gym-zinc-400 tracking-wider">
          記録なし
        </p>
        <Button
          variant="ghost"
          onClick={() => onAddWorkout(date)}
          className="mt-1 text-[10px] font-bold bg-gym-white border border-gym-zinc-200 shadow-soft text-gym-black px-3 py-1.5 h-auto rounded-lg hover:bg-gym-zinc-50 uppercase tracking-wider"
        >
          <Plus size={10} weight="bold" data-icon="inline-start" />
          追加
        </Button>
      </div>
    </>
  )
}
