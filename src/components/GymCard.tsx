import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type GymCardProps = ComponentProps<'div'> & {
  /** カード内 padding: default = p-4(16px) / sm = p-3(12px) */
  size?: 'default' | 'sm'
  /** solid = 白背景+影 / dashed = 透明+破線（プレースホルダ） */
  variant?: 'solid' | 'dashed'
}

/**
 * `rounded-[24px]` のコンテンツカードの見た目（角丸・背景・影・内側 padding）を内包する。
 * 配置（`mx-page`・`mb-*`）と種別境界線（History の `border`）は配置責務として
 * 呼び出し側で付与する。詳細は docs/design/tokens.md「カードコンポーネント」を参照。
 */
export function GymCard({
  className,
  size = 'default',
  variant = 'solid',
  ...props
}: GymCardProps) {
  return (
    <div
      data-slot="gym-card"
      className={cn(
        'rounded-[24px]',
        size === 'sm' ? 'p-3' : 'p-4',
        variant === 'solid'
          ? 'bg-gym-white shadow-soft'
          : 'bg-transparent border-2 border-dashed border-gym-zinc-200',
        className,
      )}
      {...props}
    />
  )
}
