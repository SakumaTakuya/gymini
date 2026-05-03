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

function getDayElement(dayNum: number) {
  // Find button whose visible text content is the day number
  const buttons = screen.getAllByRole('button')
  return buttons.find((btn) => {
    const text = btn.textContent?.trim()
    return text === String(dayNum)
  })
}

describe('MonthCalendar', () => {
  it('renders 7-column grid with weekday headers', () => {
    setup()
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    weekdays.forEach((day) => {
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

  it('calls onPrevMonth when left chevron clicked', () => {
    const props = setup()
    fireEvent.click(screen.getByLabelText('前月'))
    expect(props.onPrevMonth).toHaveBeenCalledOnce()
  })

  it('calls onNextMonth when right chevron clicked', () => {
    const props = setup()
    fireEvent.click(screen.getByLabelText('次月'))
    expect(props.onNextMonth).toHaveBeenCalledOnce()
  })

  it('shows workout marker on days with workouts', () => {
    setup({
      daysWithWorkouts: new Set([
        '2026-04-05' as DateString,
        '2026-04-10' as DateString,
      ]),
    })
    const markers = screen.getAllByTestId('workout-marker')
    expect(markers.length).toBe(2)
  })

  it('workout days have bold text, non-workout days are muted', () => {
    setup({
      daysWithWorkouts: new Set(['2026-04-05' as DateString]),
    })
    const day5 = getDayElement(5)
    expect(day5).toBeDefined()
    expect(day5!.className).toContain('text-gym-black')

    const day6 = getDayElement(6)
    expect(day6).toBeDefined()
    expect(day6!.className).toContain('text-gym-zinc-400')
  })

  it('calls onSelectDate when a day is clicked', () => {
    const props = setup()
    const day15 = getDayElement(15)
    expect(day15).toBeDefined()
    fireEvent.click(day15!)
    expect(props.onSelectDate).toHaveBeenCalledWith('2026-04-15')
  })

  it('selected date has ring style', () => {
    setup({ selectedDate: '2026-04-20' as DateString })
    const day20 = getDayElement(20)
    expect(day20).toBeDefined()
    expect(day20!.className).toContain('ring-2')
    expect(day20!.className).toContain('ring-gym-black')
  })

  it('today has black background with white text', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 15))

    setup({ selectedDate: '2026-04-01' as DateString })

    const today = getDayElement(15)
    expect(today).toBeDefined()
    expect(today!.className).toContain('bg-gym-black')
    expect(today!.className).toContain('text-white')

    vi.useRealTimers()
  })

  it('today with workout shows both styles', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 15))

    setup({
      selectedDate: '2026-04-01' as DateString,
      daysWithWorkouts: new Set(['2026-04-15' as DateString]),
    })

    const today = getDayElement(15)
    expect(today).toBeDefined()
    expect(today!.className).toContain('bg-gym-black')
    const marker = today!.querySelector('[data-testid="workout-marker"]')
    expect(marker).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('future date is clickable', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 10))

    const props = setup()
    const day25 = getDayElement(25)
    expect(day25).toBeDefined()
    fireEvent.click(day25!)
    expect(props.onSelectDate).toHaveBeenCalledWith('2026-04-25')

    vi.useRealTimers()
  })

  it('outside month days are not clickable', () => {
    setup({ displayMonth: { year: 2026, month: 4 } })
    // Outside days are rendered as <span>, not <button>
    const spans = document.querySelectorAll('span')
    const outsideSpan = Array.from(spans).find(
      (el) =>
        el.textContent === '31' &&
        el.className.includes('text-gym-zinc-200'),
    )
    expect(outsideSpan).toBeDefined()
  })
})
