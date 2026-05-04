import { useWorkoutSession } from '../hooks/useWorkoutSession'
import { IdleView } from '../components/IdleView'
import { ActiveSessionView } from '../components/workout/ActiveSessionView'
import { TimerPill } from '../components/workout/TimerPill'
import { AppHeaderContent } from '../components/AppHeaderContext'
import { GearIcon } from '../components/GearIcon'

export function TrainingPage() {
  const { isActive, startSession, elapsedSeconds, endSession } =
    useWorkoutSession()

  if (isActive) {
    return (
      <>
        <AppHeaderContent
          title="セッション中"
          variant="session-active"
          trailing={
            <>
              <TimerPill elapsedSeconds={elapsedSeconds} />
              <button
                type="button"
                onClick={endSession}
                className="focus-ring min-h-[44px] min-w-[44px] flex items-center justify-center text-gym-accent text-sm font-bold bg-red-50/90 px-3 py-1.5 rounded-lg"
              >
                終了
              </button>
              <GearIcon variant="overlay" />
            </>
          }
        />
        <ActiveSessionView />
      </>
    )
  }

  return (
    <>
      <AppHeaderContent trailing={<GearIcon variant="overlay" />} />
      <IdleView onStartTraining={() => startSession()} />
    </>
  )
}
