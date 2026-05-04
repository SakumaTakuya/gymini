import { useMemo, useRef, useState, type TransitionEvent } from 'react'
import { DayPicker, type DayButtonProps } from 'react-day-picker'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { IconButton } from '@/components/ui/icon-button'
import { cn } from '@/lib/utils'
import { useSwipe } from '../hooks/useSwipe'
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
      className="flex-shrink-0 w-full"
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

const SWIPE_TRANSITION = 'transform 200ms ease-out'

export function MonthCalendar({
  displayMonth,
  selectedDate,
  daysWithWorkouts,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: MonthCalendarProps) {
  const today = todayDateString()

  const [centerMonth, setCenterMonth] = useState<MonthValue>(displayMonth)
  const [dragPx, setDragPx] = useState(0)
  const [snap, setSnap] = useState<null | 'prev' | 'next' | 'center'>(null)
  const pendingCommitRef = useRef<null | 'prev' | 'next'>(null)

  // Sync internal center with external displayMonth (button clicks, URL changes)
  // unless we're mid-snap (avoid clobbering animation).
  if (
    !snap &&
    (displayMonth.year !== centerMonth.year ||
      displayMonth.month !== centerMonth.month)
  ) {
    setCenterMonth(displayMonth)
  }

  const prevMonth = useMemo(() => shiftMonth(centerMonth, -1), [centerMonth])
  const nextMonth = useMemo(() => shiftMonth(centerMonth, 1), [centerMonth])

  const swipeHandlers = useSwipe(
    {
      onDragChange: (dx) => {
        if (snap) return
        setDragPx(dx)
      },
      onSwipeLeft: () => {
        pendingCommitRef.current = 'next'
        setSnap('next')
      },
      onSwipeRight: () => {
        pendingCommitRef.current = 'prev'
        setSnap('prev')
      },
      onDragEnd: () => {
        if (pendingCommitRef.current) return
        if (dragPx !== 0) {
          setSnap('center')
          setDragPx(0)
        } else {
          setSnap(null)
        }
      },
    },
    { threshold: 50, verticalLimit: 60 },
  )

  function handleTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    const commit = pendingCommitRef.current
    if (commit === 'prev') {
      setCenterMonth(prevMonth)
      onPrevMonth()
    } else if (commit === 'next') {
      setCenterMonth(nextMonth)
      onNextMonth()
    }
    pendingCommitRef.current = null
    setSnap(null)
    setDragPx(0)
  }

  const transform =
    snap === 'prev'
      ? 'translateX(0%)'
      : snap === 'next'
        ? 'translateX(-200%)'
        : `translateX(calc(-100% + ${dragPx}px))`

  const transition = snap ? SWIPE_TRANSITION : 'none'

  return (
    <Card className="mx-4 rounded-[24px] p-5 shadow-soft border border-gym-zinc-100 mb-8 ring-0">
      {/* Month Header */}
      <div className="flex justify-between items-center mb-6 px-2">
        <IconButton
          onClick={onPrevMonth}
          className="rounded-full text-gym-zinc-400 hover:bg-gym-zinc-50 transition-colors"
          aria-label="前月"
        >
          <CaretLeft weight="bold" />
        </IconButton>
        <h2 className="font-outfit font-bold tracking-tight text-gym-black text-lg flex gap-1 items-center">
          {centerMonth.year}
          <span className="font-jp text-sm font-bold text-gym-zinc-400">年</span>
          {centerMonth.month}
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

      {/* Carousel viewport: clips off-screen panels */}
      <div className="overflow-hidden touch-pan-y" {...swipeHandlers}>
        <div
          data-testid="calendar-track"
          className="flex"
          style={{ transform, transition }}
          onTransitionEnd={handleTransitionEnd}
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
            month={centerMonth}
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
      </div>
    </Card>
  )
}
