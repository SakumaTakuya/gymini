import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimerPill } from './TimerPill'

describe('TimerPill', () => {
  it('ゼロ秒のとき00:00:00を描画する', () => {
    render(<TimerPill elapsedSeconds={0} />)
    expect(screen.getByText('00:00:00')).toBeInTheDocument()
  })

  it('経過秒数をHH:MM:SS形式でフォーマットする', () => {
    render(<TimerPill elapsedSeconds={14 * 60 + 32} />)
    expect(screen.getByText('00:14:32')).toBeInTheDocument()
  })

  it('1時間を超える値をフォーマットする', () => {
    render(<TimerPill elapsedSeconds={2 * 3600 + 5 * 60 + 9} />)
    expect(screen.getByText('02:05:09')).toBeInTheDocument()
  })
})
