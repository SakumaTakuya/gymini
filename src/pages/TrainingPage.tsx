import { useWorkoutSession } from '../hooks/useWorkoutSession'
import { IdleView } from '../components/IdleView'
import { ActiveSessionView } from '../components/workout/ActiveSessionView'

export function TrainingPage() {
  const { isActive, startSession } = useWorkoutSession()

  if (isActive) {
    return <ActiveSessionView />
  }

  return <IdleView onStartTraining={() => startSession()} />
}
