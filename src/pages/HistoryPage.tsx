import { useNavigate } from '@tanstack/react-router'
import { useCalendar } from '../hooks/useCalendar'
import { useWorkoutsForDate } from '../hooks/useWorkoutsForDate'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import { MonthCalendar } from '../components/MonthCalendar'
import { WorkoutSummary } from '../components/WorkoutSummary'
import { EmptyDayState } from '../components/EmptyDayState'
import { GearIcon } from '../components/GearIcon'
import { AppHeaderContent } from '../components/AppHeaderContext'
import type { DateString } from '../schemas/date'

export function HistoryPage() {
  const {
    selectedDate,
    displayMonth,
    goToPrevMonth,
    goToNextMonth,
    selectDate,
    daysWithWorkouts,
    dayCategories,
  } = useCalendar()

  const workouts = useWorkoutsForDate(selectedDate)
  const startSession = useWorkoutSessionStore((s) => s.startSession)
  const navigate = useNavigate()

  const handleAddWorkout = (date: DateString) => {
    startSession(date)
    navigate({ to: '/training' })
  }

  return (
    <>
      <AppHeaderContent trailing={<GearIcon variant="overlay" />} />
      <div className="flex-1 pt-content-top bg-gym-zinc-50 pb-content-bottom-scroll overflow-y-auto">
        <MonthCalendar
          displayMonth={displayMonth}
          selectedDate={selectedDate}
          daysWithWorkouts={daysWithWorkouts}
          dayCategories={dayCategories}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onSelectDate={selectDate}
        />

        {workouts.length > 0 ? (
          <WorkoutSummary date={selectedDate} workouts={workouts} />
        ) : (
          <EmptyDayState date={selectedDate} onAddWorkout={handleAddWorkout} />
        )}
      </div>
    </>
  )
}
