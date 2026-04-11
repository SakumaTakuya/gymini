import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  dateStringSchema,
  toDateString,
  todayDateString,
  isoDateTimeSchema,
  toISODateTimeString,
  nowISODateTimeString,
} from './date'

describe('dateStringSchema', () => {
  it('accepts valid YYYY-MM-DD format', () => {
    expect(dateStringSchema.parse('2026-03-08')).toBe('2026-03-08')
  })

  it('rejects invalid date format', () => {
    expect(() => dateStringSchema.parse('03-08-2026')).toThrow()
    expect(() => dateStringSchema.parse('2026/03/08')).toThrow()
    expect(() => dateStringSchema.parse('not-a-date')).toThrow()
    expect(() => dateStringSchema.parse('')).toThrow()
  })
})

describe('toDateString', () => {
  it('returns branded DateString for valid input', () => {
    const result = toDateString('2026-03-08')
    expect(result).toBe('2026-03-08')
  })

  it('throws for invalid input', () => {
    expect(() => toDateString('invalid')).toThrow()
  })
})

describe('todayDateString', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns today in YYYY-MM-DD format', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-12T10:00:00Z'))
    const result = todayDateString()
    // The exact value depends on timezone, but it should match YYYY-MM-DD
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('isoDateTimeSchema', () => {
  it('accepts valid ISO 8601 datetime', () => {
    expect(isoDateTimeSchema.parse('2026-03-08T10:00:00.000Z')).toBe(
      '2026-03-08T10:00:00.000Z',
    )
  })

  it('accepts datetime with timezone offset', () => {
    expect(isoDateTimeSchema.parse('2026-03-08T10:00:00+09:00')).toBe(
      '2026-03-08T10:00:00+09:00',
    )
  })

  it('rejects invalid datetime format', () => {
    expect(() => isoDateTimeSchema.parse('2026-03-08')).toThrow()
    expect(() => isoDateTimeSchema.parse('not-a-datetime')).toThrow()
    expect(() => isoDateTimeSchema.parse('')).toThrow()
  })
})

describe('toISODateTimeString', () => {
  it('returns branded ISODateTimeString for valid input', () => {
    const result = toISODateTimeString('2026-03-08T10:00:00.000Z')
    expect(result).toBe('2026-03-08T10:00:00.000Z')
  })

  it('throws for invalid input', () => {
    expect(() => toISODateTimeString('invalid')).toThrow()
  })
})

describe('nowISODateTimeString', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns current time in ISO 8601 format', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-08T10:00:00.000Z'))
    const result = nowISODateTimeString()
    expect(result).toBe('2026-03-08T10:00:00.000Z')
  })
})
