import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyDayState } from './EmptyDayState'
import type { DateString } from '../schemas/date'

describe('EmptyDayState', () => {
  const date = '2026-04-12' as DateString

  it('empty-day-stateコンテナを描画する', () => {
    render(<EmptyDayState date={date} onAddWorkout={vi.fn()} />)
    expect(screen.getByTestId('empty-day-state')).toBeInTheDocument()
  })

  it('日付ヘッダーを表示する', () => {
    render(<EmptyDayState date={date} onAddWorkout={vi.fn()} />)
    expect(screen.getByText('4月12日の記録')).toBeInTheDocument()
  })

  it('"記録なし"テキストを表示する', () => {
    render(<EmptyDayState date={date} onAddWorkout={vi.fn()} />)
    expect(screen.getByText('記録なし')).toBeInTheDocument()
  })

  it('追加ボタンを表示する', () => {
    render(<EmptyDayState date={date} onAddWorkout={vi.fn()} />)
    expect(screen.getByText('追加')).toBeInTheDocument()
  })

  it('ボタンクリック時にonAddWorkoutを日付とともに呼び出す', () => {
    const onAddWorkout = vi.fn()
    render(<EmptyDayState date={date} onAddWorkout={onAddWorkout} />)
    fireEvent.click(screen.getByText('追加'))
    expect(onAddWorkout).toHaveBeenCalledWith('2026-04-12')
  })

  it('破線ボーダーのコンテナを持つ', () => {
    render(<EmptyDayState date={date} onAddWorkout={vi.fn()} />)
    const container = screen.getByTestId('empty-day-state')
    expect(container.className).toContain('border-dashed')
  })

  it('コンテナの縦パディングは py-6（旧 py-8 ではない）', () => {
    render(<EmptyDayState date={date} onAddWorkout={vi.fn()} />)
    const container = screen.getByTestId('empty-day-state')
    expect(container.className).toContain('py-6')
    expect(container.className).not.toContain('py-8')
  })
})
