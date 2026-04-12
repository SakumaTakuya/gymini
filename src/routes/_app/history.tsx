import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { HistoryPage } from '../../pages/HistoryPage'
import { dateStringSchema } from '../../schemas/date'

const historySearchSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  date: dateStringSchema.optional(),
})

export const Route = createFileRoute('/_app/history')({
  component: HistoryPage,
  validateSearch: historySearchSchema,
})
