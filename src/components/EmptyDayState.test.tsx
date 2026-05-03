import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyDayState } from './EmptyDayState'
import type { DateString } from '../schemas/date'

describe('EmptyDayState', () => {
  const date = '2026-04-12' as DateString

  it('renders empty-day-state container', () => {
    render(<EmptyDayState date={date} onAddWorkout={vi.fn()} />)
    expect(screen.getByTestId('empty-day-state')).toBeInTheDocument()
  })

  it('shows date header', () => {
    render(<EmptyDayState date={date} onAddWorkout={vi.fn()} />)
    expect(screen.getByText('4月12日の記録')).toBeInTheDocument()
  })

  it('shows "記録なし" text', () => {
    render(<EmptyDayState date={date} onAddWorkout={vi.fn()} />)
    expect(screen.getByText('記録なし')).toBeInTheDocument()
  })

  it('shows add button', () => {
    render(<EmptyDayState date={date} onAddWorkout={vi.fn()} />)
    expect(screen.getByText('追加')).toBeInTheDocument()
  })

  it('calls onAddWorkout with date on button click', () => {
    const onAddWorkout = vi.fn()
    render(<EmptyDayState date={date} onAddWorkout={onAddWorkout} />)
    fireEvent.click(screen.getByText('追加'))
    expect(onAddWorkout).toHaveBeenCalledWith('2026-04-12')
  })

  it('has dashed border container', () => {
    render(<EmptyDayState date={date} onAddWorkout={vi.fn()} />)
    const container = screen.getByTestId('empty-day-state')
    expect(container.className).toContain('border-dashed')
  })
})
