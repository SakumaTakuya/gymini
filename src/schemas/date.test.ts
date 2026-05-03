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
  it('有効な YYYY-MM-DD 形式を受け付ける', () => {
    expect(dateStringSchema.parse('2026-03-08')).toBe('2026-03-08')
  })

  it('不正な日付形式を拒否する', () => {
    expect(() => dateStringSchema.parse('03-08-2026')).toThrow()
    expect(() => dateStringSchema.parse('2026/03/08')).toThrow()
    expect(() => dateStringSchema.parse('not-a-date')).toThrow()
    expect(() => dateStringSchema.parse('')).toThrow()
  })
})

describe('toDateString', () => {
  it('有効な入力に対して branded DateString を返す', () => {
    const result = toDateString('2026-03-08')
    expect(result).toBe('2026-03-08')
  })

  it('不正な入力でスローする', () => {
    expect(() => toDateString('invalid')).toThrow()
  })
})

describe('todayDateString', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('YYYY-MM-DD 形式で今日の日付を返す', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-12T10:00:00Z'))
    const result = todayDateString()
    // The exact value depends on timezone, but it should match YYYY-MM-DD
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('isoDateTimeSchema', () => {
  it('有効な ISO 8601 日時を受け付ける', () => {
    expect(isoDateTimeSchema.parse('2026-03-08T10:00:00.000Z')).toBe(
      '2026-03-08T10:00:00.000Z',
    )
  })

  it('タイムゾーンオフセット付きの日時を受け付ける', () => {
    expect(isoDateTimeSchema.parse('2026-03-08T10:00:00+09:00')).toBe(
      '2026-03-08T10:00:00+09:00',
    )
  })

  it('不正な日時形式を拒否する', () => {
    expect(() => isoDateTimeSchema.parse('2026-03-08')).toThrow()
    expect(() => isoDateTimeSchema.parse('not-a-datetime')).toThrow()
    expect(() => isoDateTimeSchema.parse('')).toThrow()
  })
})

describe('toISODateTimeString', () => {
  it('有効な入力に対して branded ISODateTimeString を返す', () => {
    const result = toISODateTimeString('2026-03-08T10:00:00.000Z')
    expect(result).toBe('2026-03-08T10:00:00.000Z')
  })

  it('不正な入力でスローする', () => {
    expect(() => toISODateTimeString('invalid')).toThrow()
  })
})

describe('nowISODateTimeString', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('ISO 8601 形式で現在時刻を返す', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-08T10:00:00.000Z'))
    const result = nowISODateTimeString()
    expect(result).toBe('2026-03-08T10:00:00.000Z')
  })
})
