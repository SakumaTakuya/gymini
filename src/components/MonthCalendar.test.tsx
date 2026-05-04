import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MonthCalendar } from './MonthCalendar'
import type { DateString } from '../schemas/date'

function setup(overrides: Partial<Parameters<typeof MonthCalendar>[0]> = {}) {
  const props = {
    displayMonth: { year: 2026, month: 4 },
    selectedDate: '2026-04-12' as DateString,
    daysWithWorkouts: new Set<DateString>(),
    onPrevMonth: vi.fn(),
    onNextMonth: vi.fn(),
    onSelectDate: vi.fn(),
    ...overrides,
  }
  render(<MonthCalendar {...props} />)
  return props
}

function getDayElement(dayNum: number) {
  // Find button whose visible text content is the day number
  const buttons = screen.getAllByRole('button')
  return buttons.find((btn) => {
    const text = btn.textContent?.trim()
    return text === String(dayNum)
  })
}

describe('MonthCalendar', () => {
  it('曜日ヘッダーを持つ7列グリッドを描画する', () => {
    setup()
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    weekdays.forEach((day) => {
      const elements = screen.getAllByText(day)
      expect(elements.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('年と月を含む月ヘッダーを描画する', () => {
    setup({ displayMonth: { year: 2026, month: 10 } })
    const header = screen.getByRole('heading', { level: 2 })
    expect(header.textContent).toContain('2026')
    expect(header.textContent).toContain('10')
  })

  it('左矢印クリック時にonPrevMonthを呼び出す', () => {
    const props = setup()
    fireEvent.click(screen.getByLabelText('前月'))
    expect(props.onPrevMonth).toHaveBeenCalledOnce()
  })

  it('右矢印クリック時にonNextMonthを呼び出す', () => {
    const props = setup()
    fireEvent.click(screen.getByLabelText('次月'))
    expect(props.onNextMonth).toHaveBeenCalledOnce()
  })

  it('ワークアウトのある日にマーカーを表示する', () => {
    setup({
      daysWithWorkouts: new Set([
        '2026-04-05' as DateString,
        '2026-04-10' as DateString,
      ]),
    })
    const markers = screen.getAllByTestId('workout-marker')
    expect(markers.length).toBe(2)
  })

  it('ワークアウトのある日は太字、ない日はミュート色で表示する', () => {
    setup({
      daysWithWorkouts: new Set(['2026-04-05' as DateString]),
    })
    const day5 = getDayElement(5)
    expect(day5).toBeDefined()
    expect(day5!.className).toContain('text-gym-black')

    const day6 = getDayElement(6)
    expect(day6).toBeDefined()
    expect(day6!.className).toContain('text-gym-zinc-400')
  })

  it('日付クリック時にonSelectDateを呼び出す', () => {
    const props = setup()
    const day15 = getDayElement(15)
    expect(day15).toBeDefined()
    fireEvent.click(day15!)
    expect(props.onSelectDate).toHaveBeenCalledWith('2026-04-15')
  })

  it('選択中の日付にリングスタイルを適用する', () => {
    setup({ selectedDate: '2026-04-20' as DateString })
    const day20 = getDayElement(20)
    expect(day20).toBeDefined()
    expect(day20!.className).toContain('ring-2')
    expect(day20!.className).toContain('ring-gym-black')
  })

  it('今日の日付は黒背景・白文字で表示する', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 15))

    setup({ selectedDate: '2026-04-01' as DateString })

    const today = getDayElement(15)
    expect(today).toBeDefined()
    expect(today!.className).toContain('bg-gym-black')
    expect(today!.className).toContain('text-gym-white')

    vi.useRealTimers()
  })

  it('今日かつワークアウトのある日は両方のスタイルを表示する', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 15))

    setup({
      selectedDate: '2026-04-01' as DateString,
      daysWithWorkouts: new Set(['2026-04-15' as DateString]),
    })

    const today = getDayElement(15)
    expect(today).toBeDefined()
    expect(today!.className).toContain('bg-gym-black')
    const marker = today!.querySelector('[data-testid="workout-marker"]')
    expect(marker).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('未来の日付はクリックできる', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 10))

    const props = setup()
    const day25 = getDayElement(25)
    expect(day25).toBeDefined()
    fireEvent.click(day25!)
    expect(props.onSelectDate).toHaveBeenCalledWith('2026-04-25')

    vi.useRealTimers()
  })

  it('月外の日付はクリックできない', () => {
    setup({ displayMonth: { year: 2026, month: 4 } })
    // Outside days are rendered as <span>, not <button>
    const spans = document.querySelectorAll('span')
    const outsideSpan = Array.from(spans).find(
      (el) =>
        el.textContent === '31' &&
        el.className.includes('text-gym-zinc-200'),
    )
    expect(outsideSpan).toBeDefined()
  })

  describe('スワイプ月遷移', () => {
    function getTrack() {
      return document.querySelector(
        '[data-testid="calendar-track"]',
      ) as HTMLElement
    }

    function touchEvent(x: number, y: number) {
      return {
        touches: [{ clientX: x, clientY: y }],
        changedTouches: [{ clientX: x, clientY: y }],
      }
    }

    it('内側トラックが初期状態で translateX(-100%) に位置する', () => {
      setup()
      const track = getTrack()
      expect(track).toBeTruthy()
      expect(track.style.transform).toContain('translateX(calc(-100%')
    })

    it('touchmove 中にトラックの transform が指の動きを反映する', () => {
      setup()
      const track = getTrack()
      const surface = track.parentElement!

      fireEvent.touchStart(surface, touchEvent(200, 100))
      fireEvent.touchMove(surface, touchEvent(150, 100))

      expect(track.style.transform).toContain('-50px')
    })

    it('閾値超えの左スワイプで transitionend 後に onNextMonth が呼ばれる', () => {
      const props = setup()
      const track = getTrack()
      const surface = track.parentElement!

      fireEvent.touchStart(surface, touchEvent(250, 100))
      fireEvent.touchMove(surface, touchEvent(100, 100))
      fireEvent.touchEnd(surface, touchEvent(100, 100))

      // スナップ中: 次月方向 -200%
      expect(track.style.transform).toContain('translateX(-200%)')
      expect(props.onNextMonth).not.toHaveBeenCalled()

      // アニメ完了をシミュレート
      fireEvent.transitionEnd(track, { propertyName: 'transform' })
      expect(props.onNextMonth).toHaveBeenCalledOnce()
      expect(props.onPrevMonth).not.toHaveBeenCalled()
    })

    it('閾値超えの右スワイプで transitionend 後に onPrevMonth が呼ばれる', () => {
      const props = setup()
      const track = getTrack()
      const surface = track.parentElement!

      fireEvent.touchStart(surface, touchEvent(50, 100))
      fireEvent.touchMove(surface, touchEvent(200, 100))
      fireEvent.touchEnd(surface, touchEvent(200, 100))

      expect(track.style.transform).toContain('translateX(0%)')
      expect(props.onPrevMonth).not.toHaveBeenCalled()

      fireEvent.transitionEnd(track, { propertyName: 'transform' })
      expect(props.onPrevMonth).toHaveBeenCalledOnce()
      expect(props.onNextMonth).not.toHaveBeenCalled()
    })

    it('閾値未満のリリースで月遷移は起きずトラックが中央に戻る', () => {
      const props = setup()
      const track = getTrack()
      const surface = track.parentElement!

      fireEvent.touchStart(surface, touchEvent(100, 100))
      fireEvent.touchMove(surface, touchEvent(110, 100))
      fireEvent.touchEnd(surface, touchEvent(110, 100))

      expect(track.style.transform).toContain('translateX(calc(-100%')
      expect(track.style.transform).toContain('0px')
      fireEvent.transitionEnd(track, { propertyName: 'transform' })
      expect(props.onPrevMonth).not.toHaveBeenCalled()
      expect(props.onNextMonth).not.toHaveBeenCalled()
    })

    it('縦移動が大きい場合は月遷移が発生しない', () => {
      const props = setup()
      const track = getTrack()
      const surface = track.parentElement!

      fireEvent.touchStart(surface, touchEvent(200, 100))
      // まず縦に大きく動く → 縦スクロール扱いで以降破棄
      fireEvent.touchMove(surface, touchEvent(200, 200))
      fireEvent.touchMove(surface, touchEvent(50, 200))
      fireEvent.touchEnd(surface, touchEvent(50, 200))

      fireEvent.transitionEnd(track, { propertyName: 'transform' })
      expect(props.onPrevMonth).not.toHaveBeenCalled()
      expect(props.onNextMonth).not.toHaveBeenCalled()
    })
  })
})
