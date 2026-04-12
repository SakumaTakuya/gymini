import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionCard } from './SectionCard'

describe('SectionCard', () => {
  it('renders children', () => {
    render(
      <SectionCard>
        <span>inner</span>
      </SectionCard>,
    )
    expect(screen.getByText('inner')).toBeInTheDocument()
  })

  it('applies FRAME5 visual spec classes', () => {
    render(
      <SectionCard data-testid="card">
        <span />
      </SectionCard>,
    )
    const card = screen.getByTestId('card')
    expect(card.className).toContain('bg-white')
    expect(card.className).toContain('rounded-2xl')
    expect(card.className).toContain('p-4')
    expect(card.className).toContain('shadow-sm')
    expect(card.className).toContain('border-zinc-100')
  })

  it('merges additional className', () => {
    render(
      <SectionCard data-testid="card" className="mt-6">
        <span />
      </SectionCard>,
    )
    expect(screen.getByTestId('card').className).toContain('mt-6')
  })
})
