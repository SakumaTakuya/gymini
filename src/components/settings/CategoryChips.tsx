import { cn } from '@/lib/utils'
import type { ExerciseCategory } from '@/schemas/exercise'
import {
  CATEGORY_ORDER,
  categoryColor,
  categoryLabel,
} from '@/lib/exerciseCategory'

type CategoryChipsProps = {
  value: ExerciseCategory
  onChange: (category: ExerciseCategory) => void
}

/**
 * 種目に割り当てる部位を選ぶ単一選択チップ群。
 * 未分類（グレー）も含め CATEGORY_ORDER 全部位から選べる。
 */
export function CategoryChips({ value, onChange }: CategoryChipsProps) {
  return (
    <div role="radiogroup" aria-label="部位" className="flex flex-wrap gap-1.5">
      {CATEGORY_ORDER.map((category) => {
        const selected = category === value
        return (
          <button
            key={category}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={categoryLabel(category)}
            onClick={() => onChange(category)}
            className={cn(
              'focus-ring flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold transition-colors',
              selected
                ? 'border-gym-black bg-gym-black text-gym-white'
                : 'border-gym-zinc-200 text-gym-zinc-600 hover:bg-gym-zinc-50',
            )}
          >
            <span
              aria-hidden
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: categoryColor(category) }}
            />
            {categoryLabel(category)}
          </button>
        )
      })}
    </div>
  )
}
