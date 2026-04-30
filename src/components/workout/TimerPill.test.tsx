import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimerPill } from './TimerPill'

describe('TimerPill', () => {
  it('renders 00:00:00 at zero', () => {
    render(<TimerPill elapsedSeconds={0} />)
    expect(screen.getByText('00:00:00')).toBeInTheDocument()
  })

  it('formats elapsed seconds as HH:MM:SS', () => {
    render(<TimerPill elapsedSeconds={14 * 60 + 32} />)
    expect(screen.getByText('00:14:32')).toBeInTheDocument()
  })

  it('formats values beyond an hour', () => {
    render(<TimerPill elapsedSeconds={2 * 3600 + 5 * 60 + 9} />)
    expect(screen.getByText('02:05:09')).toBeInTheDocument()
  })
})
