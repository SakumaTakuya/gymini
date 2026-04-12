import type { ComponentProps } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function SectionCard({
  className,
  children,
  ...props
}: ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        'bg-white rounded-[20px] p-4 shadow-soft border border-gym-zinc-100 ring-0 gap-0',
        className,
      )}
      {...props}
    >
      {children}
    </Card>
  )
}
