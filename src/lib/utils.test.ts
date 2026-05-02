import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('引数なしで空文字を返す', () => {
    expect(cn()).toBe('')
  })

  it('複数クラス文字列を結合する', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('falsy な値（undefined/false/null）を除外する', () => {
    expect(cn('foo', undefined, false, null, 'bar')).toBe('foo bar')
  })

  it('競合する Tailwind クラスをマージする（後者優先）', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('競合するテキストカラークラスをマージする', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('非競合クラスを両方保持する', () => {
    expect(cn('p-2', 'm-4')).toBe('p-2 m-4')
  })

  it('オブジェクト記法を処理する', () => {
    expect(cn({ 'text-xl': true, 'font-bold': false })).toBe('text-xl')
  })

  it('配列記法を処理する', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })
})
