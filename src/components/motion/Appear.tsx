import type { CSSProperties, ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useAppear } from '@/hooks/useAppear'

type AppearProps = {
  /** 描画する要素種別（既定 'div'）。リスト項目なら 'li' など。 */
  as?: ElementType
  /** リスト内の位置。stagger 遅延に使う。 */
  index?: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
} & Record<string, unknown>

/**
 * 子要素をマウント時の出現アニメ（animate-appear）で包む薄いラッパー。
 * 出現ロジックは useAppear に集約し、reduced-motion と stagger を自動で扱う。
 * 「子をただ包みたい」リスト/カード用途のシンタックスシュガー。
 */
export function Appear({
  as: Tag = 'div',
  index = 0,
  className,
  style,
  children,
  ...rest
}: AppearProps) {
  const appear = useAppear(index)
  return (
    <Tag
      className={cn(appear.className, className)}
      style={{ ...appear.style, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
