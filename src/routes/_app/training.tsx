import { createFileRoute } from '@tanstack/react-router'
import { TrainingPage } from '../../pages/TrainingPage'

export const Route = createFileRoute('/_app/training')({
  component: TrainingPage,
})
