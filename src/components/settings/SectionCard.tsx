import type { ComponentProps, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type SectionCardProps = ComponentProps<typeof Card> & {
  /**
   * カード外側のセクションラベル（design-system FRAME5 の
   * `text-[10px] uppercase tracking-widest` ラベル）。
   * 省略時はラベルなしでカードのみを描画する。
   */
  label?: ReactNode
}

export function SectionCard({
  label,
  className,
  children,
  ...props
}: SectionCardProps) {
  const card = (
    <Card
      className={cn(
        'bg-white rounded-[20px] shadow-soft border border-gym-zinc-100 ring-0 overflow-hidden gap-0 p-0',
        className,
      )}
      {...props}
    >
      {children}
    </Card>
  )

  if (!label) return card

  return (
    <section>
      <p className="text-[10px] font-bold text-gym-zinc-400 uppercase tracking-widest px-2 mb-2">
        {label}
      </p>
      {card}
    </section>
  )
}
