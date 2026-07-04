import { useWorkoutSession } from '../hooks/useWorkoutSession'
import { useElapsedSeconds } from '../hooks/useElapsedSeconds'
import { IdleView } from '../components/IdleView'
import { ActiveSessionView } from '../components/workout/ActiveSessionView'
import { TimerPill } from '../components/workout/TimerPill'
import { AppHeaderContent } from '../components/AppHeaderContext'
import { GearIcon } from '../components/GearIcon'
import { withViewTransition } from '../lib/viewTransition'

// 毎秒の再レンダーをこのコンポーネント内に閉じ込める。
// TrainingPage 本体で経過秒を購読すると ActiveSessionView 全体が
// 1 秒ごとに再レンダーされてしまう。
function SessionTimer({ startedAt }: { startedAt: string | null }) {
  const elapsedSeconds = useElapsedSeconds(startedAt)
  return <TimerPill elapsedSeconds={elapsedSeconds} />
}

export function TrainingPage() {
  const { isActive, startedAt, startSession, endSession } = useWorkoutSession()

  if (isActive) {
    return (
      <>
        <AppHeaderContent
          title="セッション中"
          variant="session-active"
          trailing={
            <>
              <SessionTimer startedAt={startedAt} />
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
      <IdleView onStartTraining={() => withViewTransition(() => startSession())} />
    </>
  )
}
