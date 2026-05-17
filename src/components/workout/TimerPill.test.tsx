import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { TimerPill } from './TimerPill'
import { setupHapticMocks } from '@/test/hapticMocks'

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

  describe('Matas / Cox 整理', () => {
    it('Clock アイコンは animate-pulse を持たない (常時拍動を撤去)', () => {
      const { container } = render(<TimerPill elapsedSeconds={0} />)
      const clockSvg = container.querySelector('svg')
      expect(clockSvg).not.toBeNull()
      const cls = clockSvg!.getAttribute('class') ?? ''
      expect(cls).not.toContain('animate-pulse')
    })

    it('時刻 span は tabular-nums を持つ (フォントサイズ変動防止)', () => {
      render(<TimerPill elapsedSeconds={0} />)
      const span = screen.getByText('00:00:00')
      expect(span.className).toContain('tabular-nums')
    })
  })

  describe('Cox 毎分呼吸', () => {
    let restore: () => void = () => {}
    afterEach(() => { vi.useRealTimers(); restore() })

    it('elapsedSeconds=0 で render 時は animate-breath を持たない', () => {
      ;({ restore } = setupHapticMocks())
      const { container } = render(<TimerPill elapsedSeconds={0} />)
      const pill = container.firstChild as HTMLElement
      expect(pill.className).not.toContain('animate-breath')
    })

    it('elapsedSeconds が 60 の倍数のフレームで animate-breath を持つ', () => {
      ;({ restore } = setupHapticMocks())
      vi.useFakeTimers()
      const { container, rerender } = render(<TimerPill elapsedSeconds={59} />)
      act(() => {
        rerender(<TimerPill elapsedSeconds={60} />)
      })
      const pill = container.firstChild as HTMLElement
      expect(pill.className).toContain('animate-breath')
    })

    it('1500ms 後に animate-breath が外れる', () => {
      ;({ restore } = setupHapticMocks())
      vi.useFakeTimers()
      const { container, rerender } = render(<TimerPill elapsedSeconds={59} />)
      act(() => {
        rerender(<TimerPill elapsedSeconds={60} />)
      })
      act(() => {
        vi.advanceTimersByTime(1500)
      })
      const pill = container.firstChild as HTMLElement
      expect(pill.className).not.toContain('animate-breath')
    })

    it('prefers-reduced-motion: reduce の時は呼吸を発火しない', () => {
      ;({ restore } = setupHapticMocks({ reducedMotion: true }))
      const { container, rerender } = render(<TimerPill elapsedSeconds={59} />)
      rerender(<TimerPill elapsedSeconds={60} />)
      const pill = container.firstChild as HTMLElement
      expect(pill.className).not.toContain('animate-breath')
    })
  })
})
