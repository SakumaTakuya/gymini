import { createFileRoute } from '@tanstack/react-router'
import { AIChatPage } from '../../pages/AIChatPage'

export const Route = createFileRoute('/_app/ai')({
  component: AIChatPage,
})
