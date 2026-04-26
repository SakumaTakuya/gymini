import { useMemo } from 'react'
import { DayPicker, type DayButtonProps } from 'react-day-picker'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DateString } from '../schemas/date'
import { toDateString, todayDateString } from '../schemas/date'

interface MonthCalendarProps {
  displayMonth: { year: number; month: number }
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
        isToday && 'bg-gym-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]',
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

export function MonthCalendar({
  displayMonth,
  selectedDate,
  daysWithWorkouts,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: MonthCalendarProps) {
  const month = useMemo(
    () => new Date(displayMonth.year, displayMonth.month - 1, 1),
    [displayMonth.year, displayMonth.month],
  )

  const today = todayDateString()

  return (
    <Card className="mx-4 rounded-[32px] p-5 shadow-soft border border-gym-zinc-100 mb-8 ring-0">
      {/* Month Header */}
      <div className="flex justify-between items-center mb-6 px-2">
        <button
          type="button"
          onClick={onPrevMonth}
          className="focus-ring w-8 h-8 rounded-full flex items-center justify-center text-gym-zinc-400 hover:bg-gym-zinc-50 transition-colors"
          aria-label="前月"
        >
          <CaretLeft weight="bold" />
        </button>
        <h2 className="font-outfit font-bold tracking-tight text-gym-black text-lg flex gap-1 items-center">
          {displayMonth.year}
          <span className="font-jp text-sm font-bold text-gym-zinc-400">年</span>
          {displayMonth.month}
          <span className="font-jp text-sm font-bold text-gym-zinc-400">月</span>
        </h2>
        <button
          type="button"
          onClick={onNextMonth}
          className="focus-ring w-8 h-8 rounded-full flex items-center justify-center text-gym-zinc-400 hover:bg-gym-zinc-50 transition-colors"
          aria-label="次月"
        >
          <CaretRight weight="bold" />
        </button>
      </div>

      {/* Calendar Grid via react-day-picker */}
      <DayPicker
        mode="single"
        month={month}
        selected={new Date(selectedDate + 'T00:00:00')}
        onSelect={(date) => {
          if (date) onSelectDate(toDateStr(date))
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
    </Card>
  )
}
