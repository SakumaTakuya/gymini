import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WeightSuggestionChips } from './WeightSuggestionChips'

describe('WeightSuggestionChips', () => {
  it('候補が空の場合は何も描画しない', () => {
    const { container } = render(
      <WeightSuggestionChips suggestions={[]} onApply={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('「推奨」ラベルと候補の重量×回数を表示する', () => {
    render(
      <WeightSuggestionChips
        suggestions={[
          { weight: 62.5, reps: 8 },
          { weight: 60, reps: 10 },
        ]}
        onApply={vi.fn()}
      />,
    )
    expect(screen.getByText('推奨')).toBeInTheDocument()
    expect(screen.getByText('62.5')).toBeInTheDocument()
    expect(screen.getByText('× 8')).toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText('× 10')).toBeInTheDocument()
  })

  it('チップをタップすると onApply に候補が渡る', () => {
    const onApply = vi.fn()
    render(
      <WeightSuggestionChips
        suggestions={[{ weight: 62.5, reps: 8 }]}
        onApply={onApply}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '62.5kg × 8回を入力' }))
    expect(onApply).toHaveBeenCalledWith({ weight: 62.5, reps: 8 })
  })

  it('デザイントークンに準拠する（rounded-full / border-gym-zinc-200 / bg-gym-zinc-50 / focus-ring）', () => {
    render(
      <WeightSuggestionChips
        suggestions={[{ weight: 62.5, reps: 8 }]}
        onApply={vi.fn()}
      />,
    )
    const chip = screen.getByRole('button', { name: '62.5kg × 8回を入力' })
    expect(chip.className).toContain('rounded-full')
    expect(chip.className).toContain('border-gym-zinc-200')
    expect(chip.className).toContain('bg-gym-zinc-50')
    expect(chip.className).toContain('focus-ring')
  })

  it('数値は font-outfit + tabular-nums で表示する', () => {
    render(
      <WeightSuggestionChips
        suggestions={[{ weight: 62.5, reps: 8 }]}
        onApply={vi.fn()}
      />,
    )
    const value = screen.getByText('62.5')
    expect(value.className).toContain('font-outfit')
    expect(value.className).toContain('tabular-nums')
  })
})
