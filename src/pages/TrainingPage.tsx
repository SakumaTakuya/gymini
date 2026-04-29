import { useWorkoutSession } from '../hooks/useWorkoutSession'
import { IdleView } from '../components/IdleView'
import { ActiveSessionView } from '../components/workout/ActiveSessionView'
import { SessionHeader } from '../components/workout/SessionHeader'

export function TrainingPage() {
  const { isActive, startSession, elapsedSeconds, endSession } =
    useWorkoutSession()

  if (isActive) {
    return (
      <>
        <SessionHeader
          elapsedSeconds={elapsedSeconds}
          onEndSession={endSession}
        />
        <ActiveSessionView />
      </>
    )
  }

  return <IdleView onStartTraining={() => startSession()} />
}
