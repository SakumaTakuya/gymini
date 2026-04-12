import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MonthCalendar } from './MonthCalendar'
import type { DateString } from '../schemas/date'

function setup(overrides: Partial<Parameters<typeof MonthCalendar>[0]> = {}) {
  const props = {
    displayMonth: { year: 2026, month: 4 },
    selectedDate: '2026-04-12' as DateString,
    daysWithWorkouts: new Set<DateString>(),
    onPrevMonth: vi.fn(),
    onNextMonth: vi.fn(),
    onSelectDate: vi.fn(),
    ...overrides,
  }
  render(<MonthCalendar {...props} />)
  return props
}

describe('MonthCalendar', () => {
  it('renders 7-column grid with weekday headers (FR-001)', () => {
    setup()
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    weekdays.forEach((day) => {
      // Some characters like '月' appear in both weekday header and month header
      const elements = screen.getAllByText(day)
      expect(elements.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('renders month header with year and month', () => {
    setup({ displayMonth: { year: 2026, month: 10 } })
    const header = screen.getByRole('heading', { level: 2 })
    expect(header.textContent).toContain('2026')
    expect(header.textContent).toContain('10')
  })

  it('calls onPrevMonth when left chevron clicked (FR-002)', () => {
    const props = setup()
    fireEvent.click(screen.getByLabelText('前月'))
    expect(props.onPrevMonth).toHaveBeenCalledOnce()
  })

  it('calls onNextMonth when right chevron clicked (FR-002)', () => {
    const props = setup()
    fireEvent.click(screen.getByLabelText('次月'))
    expect(props.onNextMonth).toHaveBeenCalledOnce()
  })

  it('shows workout marker on days with workouts (FR-003)', () => {
    setup({
      daysWithWorkouts: new Set(['2026-04-05' as DateString, '2026-04-10' as DateString]),
    })
    const markers = screen.getAllByTestId('workout-marker')
    expect(markers.length).toBe(2)
  })

  it('workout days have bold text, non-workout days are muted (FR-004)', () => {
    setup({
      daysWithWorkouts: new Set(['2026-04-05' as DateString]),
    })
    // Day 5 has workout → text-gym-black
    const day5 = screen.getByRole('button', { name: '5' })
    expect(day5.className).toContain('text-gym-black')

    // Day 6 has no workout → text-gym-zinc-400
    const day6 = screen.getByRole('button', { name: '6' })
    expect(day6.className).toContain('text-gym-zinc-400')
  })

  it('calls onSelectDate when a day is clicked (FR-005)', () => {
    const props = setup()
    fireEvent.click(screen.getByRole('button', { name: '15' }))
    expect(props.onSelectDate).toHaveBeenCalledWith('2026-04-15')
  })

  it('selected date has ring style (FR-005)', () => {
    setup({ selectedDate: '2026-04-20' as DateString })
    const day20 = screen.getByRole('button', { name: '20' })
    expect(day20.className).toContain('ring-2')
    expect(day20.className).toContain('ring-gym-black')
  })

  it('today has black background with white text (FR-009)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 15)) // April 15 2026

    setup({
      selectedDate: '2026-04-01' as DateString, // select a different day so today isn't selected
    })

    const today = screen.getByRole('button', { name: '15' })
    expect(today.className).toContain('bg-gym-black')
    expect(today.className).toContain('text-white')

    vi.useRealTimers()
  })

  it('today with workout shows both styles (FR-010)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 15))

    setup({
      selectedDate: '2026-04-01' as DateString,
      daysWithWorkouts: new Set(['2026-04-15' as DateString]),
    })

    const today = screen.getByRole('button', { name: '15' })
    expect(today.className).toContain('bg-gym-black')
    const marker = today.querySelector('[data-testid="workout-marker"]')
    expect(marker).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('future date is clickable (FR-011)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 10))

    const props = setup()
    fireEvent.click(screen.getByRole('button', { name: '25' }))
    expect(props.onSelectDate).toHaveBeenCalledWith('2026-04-25')

    vi.useRealTimers()
  })

  it('outside month days are not clickable', () => {
    // April 2026 starts on Wednesday. So Sun/Mon/Tue are trailing March days
    // They should render as divs, not buttons
    setup({ displayMonth: { year: 2026, month: 4 } })
    // March 31 is the trailing day before April 1
    const trailingDays = screen.getAllByText('31')
    // One of the 31s is March 31 (outside), the other might not exist
    const outsideDay = trailingDays.find(
      (el) => el.tagName !== 'BUTTON',
    )
    expect(outsideDay).toBeDefined()
  })
})
