import { describe, it, expect } from 'vitest'
import { formatElapsedTime } from './formatElapsedTime'

describe('formatElapsedTime', () => {
  it('0秒をフォーマットする', () => {
    expect(formatElapsedTime(0)).toBe('00:00:00')
  })

  it('秒のみをフォーマットする', () => {
    expect(formatElapsedTime(45)).toBe('00:00:45')
  })

  it('分と秒をフォーマットする', () => {
    expect(formatElapsedTime(125)).toBe('00:02:05')
  })

  it('時・分・秒をフォーマットする', () => {
    expect(formatElapsedTime(3672)).toBe('01:01:12')
  })

  it('大きな値を処理する', () => {
    expect(formatElapsedTime(36000)).toBe('10:00:00')
  })
})
