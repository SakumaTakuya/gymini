import { createFileRoute } from '@tanstack/react-router'
import { HistoryPage } from '../../pages/HistoryPage'

export const Route = createFileRoute('/_app/history')({
  component: HistoryPage,
})
