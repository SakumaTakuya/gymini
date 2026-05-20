import { Plus } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'

type AddSetButtonProps = {
  onClick: () => void
  disabled?: boolean
  label?: string
  /** label 未指定 (アイコンのみ) のときに必須。label があれば省略可で label から導出される */
  'aria-label'?: string
}

export function AddSetButton({
  onClick,
  disabled = false,
  label,
  'aria-label': ariaLabel,
}: AddSetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      className={cn(
        'focus-ring inline-flex items-center justify-center gap-1.5',
        'min-h-[44px] px-3 rounded-xl border border-dashed border-gym-zinc-300',
        'text-xs font-semibold text-gym-zinc-600 hover:text-gym-black',
        'disabled:opacity-40 disabled:cursor-not-allowed',
      )}
    >
      <Plus size={14} weight="bold" />
      {label && <span>{label}</span>}
    </button>
  )
}
