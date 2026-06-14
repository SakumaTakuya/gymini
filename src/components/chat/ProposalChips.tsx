import { Check } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import type { ProposedAction } from '../../types/chat'

export type ProposalChipsProps = {
  actions: ProposedAction[]
  consumedActionId?: string | null
  onClick: (action: ProposedAction) => void
}

export function ProposalChips({
  actions,
  consumedActionId,
  onClick,
}: ProposalChipsProps) {
  if (actions.length === 0) return null

  const disabled = Boolean(consumedActionId)

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {actions.map((action) => {
        const consumed = consumedActionId === action.id
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onClick(action)}
            disabled={disabled}
            className={cn(
              'inline-flex items-center gap-1.5',
              'min-h-[44px] rounded-full px-4 text-sm',
              'border border-gym-zinc-200',
              'bg-gym-zinc-50 text-gym-zinc-800',
              'transition-colors active:bg-gym-zinc-100',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              consumed && 'bg-gym-zinc-100 text-gym-zinc-600',
            )}
          >
            {consumed && (
              <Check size={14} weight="bold" aria-hidden="true" />
            )}
            <span>{action.label}</span>
          </button>
        )
      })}
    </div>
  )
}
