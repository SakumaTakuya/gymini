import { Sparkle } from '@phosphor-icons/react'
import type { WorkoutSet } from '../../schemas/workout'

type WeightSuggestionChipsProps = {
  suggestions: WorkoutSet[]
  onApply: (set: WorkoutSet) => void
}

/**
 * 過去記録から算出した推奨セット（重量 × 回数）のチップ列。
 * タップで pendingSet に反映するのみで、確定は従来どおり完了ボタン
 * （docs/adr/workout.md「重量提案は決定的ロジック（推定1RM）で行い、LLM を使わない」）。
 */
export function WeightSuggestionChips({
  suggestions,
  onApply,
}: WeightSuggestionChipsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className="animate-appear mt-2 flex items-center gap-2 px-1">
      <span className="flex items-center gap-1 text-[10px] font-medium text-gym-zinc-400">
        <Sparkle size={11} weight="fill" aria-hidden="true" />
        推奨
      </span>
      {suggestions.map((s) => (
        <button
          key={`${s.weight}-${s.reps}`}
          type="button"
          aria-label={`${s.weight}kg × ${s.reps}回を入力`}
          onClick={() => onApply(s)}
          className="focus-ring flex min-h-[32px] items-baseline gap-1 rounded-full border border-gym-zinc-200 bg-gym-zinc-50 px-3 py-1 transition-transform duration-quick active:scale-95"
        >
          <span className="font-outfit font-bold text-sm text-gym-black tabular-nums">
            {s.weight}
          </span>
          <span className="text-[10px] font-medium text-gym-zinc-400">kg</span>
          <span className="ml-1 font-outfit font-bold text-sm text-gym-black tabular-nums">
            × {s.reps}
          </span>
        </button>
      ))}
    </div>
  )
}
