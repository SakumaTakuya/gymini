import { describe, it, expect } from 'vitest'
import { formatElapsedTime } from './formatElapsedTime'

describe('formatElapsedTime', () => {
  it('formats 0 seconds', () => {
    expect(formatElapsedTime(0)).toBe('00:00:00')
  })

  it('formats seconds only', () => {
    expect(formatElapsedTime(45)).toBe('00:00:45')
  })

  it('formats minutes and seconds', () => {
    expect(formatElapsedTime(125)).toBe('00:02:05')
  })

  it('formats hours, minutes, and seconds', () => {
    expect(formatElapsedTime(3672)).toBe('01:01:12')
  })

  it('handles large values', () => {
    expect(formatElapsedTime(36000)).toBe('10:00:00')
  })
})
