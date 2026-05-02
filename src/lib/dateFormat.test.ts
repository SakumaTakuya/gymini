import { describe, it, expect } from 'vitest'
import { formatDateHeader } from './dateFormat'
import type { DateString } from '../schemas/date'

describe('formatDateHeader', () => {
  it('1桁の月・日をゼロなしでフォーマットする', () => {
    expect(formatDateHeader('2026-01-05' as DateString)).toBe('1月5日の記録')
  })

  it('2桁の月・日をフォーマットする', () => {
    expect(formatDateHeader('2026-11-23' as DateString)).toBe('11月23日の記録')
  })

  it('1月1日をフォーマットする', () => {
    expect(formatDateHeader('2026-01-01' as DateString)).toBe('1月1日の記録')
  })

  it('12月31日をフォーマットする', () => {
    expect(formatDateHeader('2026-12-31' as DateString)).toBe('12月31日の記録')
  })

  it('4月12日をフォーマットする', () => {
    expect(formatDateHeader('2026-04-12' as DateString)).toBe('4月12日の記録')
  })
})
