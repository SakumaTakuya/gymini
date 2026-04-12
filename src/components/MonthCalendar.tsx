import { CaretLeft, CaretRight } from '@phosphor-icons/react'
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

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

function formatDateString(year: number, month: number, day: number): DateString {
  const str = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return toDateString(str)
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export function MonthCalendar({
  displayMonth,
  selectedDate,
  daysWithWorkouts,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: MonthCalendarProps) {
  const { year, month } = displayMonth
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const today = todayDateString()

  // Previous month trailing days
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

  const cells: Array<{
    day: number
    dateString: DateString | null
    isCurrentMonth: boolean
  }> = []

  // Leading days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      day: daysInPrevMonth - i,
      dateString: null,
      isCurrentMonth: false,
    })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      dateString: formatDateString(year, month, d),
      isCurrentMonth: true,
    })
  }

  // Trailing days from next month
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        dateString: null,
        isCurrentMonth: false,
      })
    }
  }

  return (
    <div className="mx-4 bg-white rounded-[32px] p-5 shadow-soft border border-gym-zinc-100 mb-8">
      {/* Month Header */}
      <div className="flex justify-between items-center mb-6 px-2">
        <button
          onClick={onPrevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gym-zinc-400 hover:bg-gym-zinc-50 transition-colors"
          aria-label="前月"
        >
          <CaretLeft weight="bold" />
        </button>
        <h2 className="font-outfit font-bold tracking-tight text-gym-black text-lg flex gap-1 items-center">
          {year}
          <span className="font-jp text-sm font-bold text-gym-zinc-400">年</span>
          {month}
          <span className="font-jp text-sm font-bold text-gym-zinc-400">月</span>
        </h2>
        <button
          onClick={onNextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gym-zinc-400 hover:bg-gym-zinc-50 transition-colors"
          aria-label="次月"
        >
          <CaretRight weight="bold" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-3">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`text-[10px] font-bold ${i === 0 ? 'text-gym-accent' : 'text-gym-zinc-400'}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center font-outfit text-sm font-medium">
        {cells.map((cell, i) => {
          if (!cell.isCurrentMonth) {
            return (
              <div
                key={`outside-${i}`}
                className="w-9 h-9 mx-auto flex items-center justify-center rounded-full text-gym-zinc-200"
              >
                {cell.day}
              </div>
            )
          }

          const dateStr = cell.dateString!
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === today
          const hasWorkout = daysWithWorkouts.has(dateStr)

          let cellClass =
            'relative w-9 h-9 mx-auto flex items-center justify-center rounded-full cursor-pointer'

          if (isToday) {
            cellClass += ' bg-gym-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
          } else if (isSelected) {
            cellClass +=
              ' ring-2 ring-gym-black ring-offset-2 ring-offset-white text-gym-black font-bold'
          } else if (hasWorkout) {
            cellClass += ' text-gym-black hover:bg-gym-zinc-50'
          } else {
            cellClass += ' text-gym-zinc-400 hover:bg-gym-zinc-50'
          }

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={cellClass}
            >
              {cell.day}
              {hasWorkout && (
                <span
                  data-testid="workout-marker"
                  className={`absolute w-1 h-1 bg-gym-accent rounded-full ${
                    isToday
                      ? 'bottom-[3px] border border-gym-black'
                      : 'bottom-1'
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
