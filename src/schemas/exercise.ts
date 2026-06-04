import { z } from 'zod'

export const exerciseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
})

export type Exercise = z.infer<typeof exerciseSchema>
