import { useMemo } from 'react'
import { DayPicker, type DayButtonProps } from 'react-day-picker'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { GymCard } from '@/components/GymCard'
import { IconButton } from '@/components/ui/icon-button'
import { useSnapScroll } from '@/hooks/useSnapScroll'
import { cn } from '@/lib/utils'
import type { DateString } from '../schemas/date'
import { toDateString, todayDateString } from '../schemas/date'

interface MonthValue {
  year: number
  month: number
}

interface MonthCalendarProps {
  displayMonth: MonthValue
  selectedDate: DateString
  daysWithWorkouts: Set<DateString>
  onPrevMonth: () => void
  onNextMonth: () => void
  onSelectDate: (date: DateString) => void
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']
const SCROLL_DEBOUNCE_MS = 120
const CENTER_PANEL_IDX = 1
const PREV_PANEL_IDX = 0
const NEXT_PANEL_IDX = 2

function toDateStr(date: Date): DateString {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return toDateString(`${y}-${m}-${d}`)
}

function shiftMonth({ year, month }: MonthValue, delta: number): MonthValue {
  const total = year * 12 + (month - 1) + delta
  return { year: Math.floor(total / 12), month: (total % 12) + 1 }
}

function GymDayButton({
  day,
  modifiers,
  selectedDate,
  daysWithWorkouts,
  today,
  ...props
}: DayButtonProps & {
  selectedDate: DateString
  daysWithWorkouts: Set<DateString>
  today: DateString
}) {
  const dateStr = toDateStr(day.date)
  const isSelected = dateStr === selectedDate
  const isToday = dateStr === today
  const hasWorkout = daysWithWorkouts.has(dateStr)
  const isOutside = modifiers.outside

  if (isOutside) {
    return (
      <span className="w-9 h-9 mx-auto flex items-center justify-center rounded-full text-gym-zinc-200">
        {day.date.getDate()}
      </span>
    )
  }

  return (
    <button
      {...props}
      className={cn(
        'focus-ring relative w-9 h-9 mx-auto flex items-center justify-center rounded-full cursor-pointer',
        isToday && 'bg-gym-black text-gym-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]',
        !isToday && isSelected && 'ring-2 ring-gym-black ring-offset-2 ring-offset-white text-gym-black font-bold',
        !isToday && !isSelected && hasWorkout && 'text-gym-black hover:bg-gym-zinc-50',
        !isToday && !isSelected && !hasWorkout && 'text-gym-zinc-400 hover:bg-gym-zinc-50',
      )}
    >
      {day.date.getDate()}
      {hasWorkout && (
        <span
          data-testid="workout-marker"
          className={cn(
            'absolute w-1 h-1 bg-gym-accent rounded-full',
            isToday ? 'bottom-[3px] border border-gym-black' : 'bottom-1',
          )}
        />
      )}
    </button>
  )
}

interface MonthPanelProps {
  month: MonthValue
  selectedDate: DateString
  daysWithWorkouts: Set<DateString>
  today: DateString
  onSelectDate: (date: DateString) => void
  interactive: boolean
}

function MonthPanel({
  month,
  selectedDate,
  daysWithWorkouts,
  today,
  onSelectDate,
  interactive,
}: MonthPanelProps) {
  const monthDate = useMemo(
    () => new Date(month.year, month.month - 1, 1),
    [month.year, month.month],
  )

  return (
    <div
      data-testid="calendar-panel"
      className="snap-start shrink-0 basis-full min-w-full"
      aria-hidden={interactive ? undefined : true}
      inert={!interactive}
    >
      <DayPicker
        mode="single"
        month={monthDate}
        selected={new Date(selectedDate + 'T00:00:00')}
        onSelect={(date) => {
          if (date && interactive) onSelectDate(toDateStr(date))
        }}
        showOutsideDays
        fixedWeeks={false}
        hideNavigation
        formatters={{
          formatWeekdayName: (day) => WEEKDAY_LABELS[day.getDay()],
        }}
        classNames={{
          months: 'w-full',
          month: 'w-full',
          month_caption: 'hidden',
          nav: 'hidden',
          month_grid: 'w-full',
          weekdays: 'grid grid-cols-7 gap-1 text-center mb-3 [&>:first-child]:text-gym-accent',
          weekday: 'text-[10px] font-bold text-gym-zinc-400 text-center',
          weeks: 'w-full',
          week: 'grid grid-cols-7 gap-y-3 gap-x-1 text-center font-outfit text-sm font-medium',
          day: '',
          root: 'w-full',
        }}
        components={{
          DayButton: (props) => (
            <GymDayButton
              {...props}
              selectedDate={selectedDate}
              daysWithWorkouts={daysWithWorkouts}
              today={today}
            />
          ),
        }}
      />
    </div>
  )
}

export function MonthCalendar({
  displayMonth,
  selectedDate,
  daysWithWorkouts,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: MonthCalendarProps) {
  const today = todayDateString()

  const prevMonth = useMemo(() => shiftMonth(displayMonth, -1), [displayMonth])
  const nextMonth = useMemo(() => shiftMonth(displayMonth, 1), [displayMonth])

  // Re-center on month change. Use a primitive key so the dep is stable —
  // a fresh displayMonth object each render would re-fire recenter unnecessarily.
  const recenterKey = displayMonth.year * 12 + displayMonth.month
  const viewportRef = useSnapScroll<HTMLDivElement>({
    centerIndex: CENTER_PANEL_IDX,
    recenterKey,
    debounceMs: SCROLL_DEBOUNCE_MS,
    onCommitIndex: (idx) => {
      if (idx === PREV_PANEL_IDX) onPrevMonth()
      else if (idx === NEXT_PANEL_IDX) onNextMonth()
    },
  })

  return (
    <GymCard className="mx-page mb-6 border border-gym-zinc-100">
      <div className="flex justify-between items-center mb-4 px-2">
        <IconButton
          onClick={onPrevMonth}
          className="rounded-full text-gym-zinc-400 hover:bg-gym-zinc-50 transition-colors"
          aria-label="前月"
        >
          <CaretLeft weight="bold" />
        </IconButton>
        <h2 className="font-outfit font-bold tracking-tight text-gym-black text-lg flex gap-1 items-center">
          {displayMonth.year}
          <span className="font-jp text-sm font-bold text-gym-zinc-400">年</span>
          {displayMonth.month}
          <span className="font-jp text-sm font-bold text-gym-zinc-400">月</span>
        </h2>
        <IconButton
          onClick={onNextMonth}
          className="rounded-full text-gym-zinc-400 hover:bg-gym-zinc-50 transition-colors"
          aria-label="次月"
        >
          <CaretRight weight="bold" />
        </IconButton>
      </div>

      <div
        ref={viewportRef}
        data-testid="calendar-viewport"
        className="flex overflow-x-auto snap-x snap-mandatory touch-pan-x overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <MonthPanel
          month={prevMonth}
          selectedDate={selectedDate}
          daysWithWorkouts={daysWithWorkouts}
          today={today}
          onSelectDate={onSelectDate}
          interactive={false}
        />
        <MonthPanel
          month={displayMonth}
          selectedDate={selectedDate}
          daysWithWorkouts={daysWithWorkouts}
          today={today}
          onSelectDate={onSelectDate}
          interactive
        />
        <MonthPanel
          month={nextMonth}
          selectedDate={selectedDate}
          daysWithWorkouts={daysWithWorkouts}
          today={today}
          onSelectDate={onSelectDate}
          interactive={false}
        />
      </div>
    </GymCard>
  )
}
