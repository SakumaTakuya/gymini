import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export function IconButton({
  className,
  variant = 'ghost',
  size = 'icon',
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn('min-h-[44px] min-w-[44px]', className)}
      {...props}
    />
  )
}
