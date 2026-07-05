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

  it('部位ごとに色ドットを表示する（複数部位＝複数ドット）', () => {
    setup({
      daysWithWorkouts: new Set(['2026-04-10' as DateString]),
      dayCategories: new Map([
        ['2026-04-10' as DateString, ['chest', 'back']],
      ]),
    })
    const day10 = getDayElement(10)
    const markers = day10!.querySelectorAll('[data-testid="workout-marker"]')
    expect(markers.length).toBe(2)
    // 胸は赤、背中は青
    expect((markers[0] as HTMLElement).style.backgroundColor).toBe('rgb(222, 58, 43)')
    expect((markers[1] as HTMLElement).style.backgroundColor).toBe('rgb(37, 99, 235)')
  })

  it('4部位以上はドットを3個に丸める', () => {
    setup({
      daysWithWorkouts: new Set(['2026-04-10' as DateString]),
      dayCategories: new Map([
        ['2026-04-10' as DateString, ['chest', 'back', 'legs', 'arms']],
      ]),
    })
    const day10 = getDayElement(10)
    const markers = day10!.querySelectorAll('[data-testid="workout-marker"]')
    expect(markers.length).toBe(3)
  })

  it('部位情報が無い日は単一マーカーにフォールバックする', () => {
    setup({
      daysWithWorkouts: new Set(['2026-04-10' as DateString]),
      dayCategories: new Map(),
    })
    const day10 = getDayElement(10)
    const markers = day10!.querySelectorAll('[data-testid="workout-marker"]')
    expect(markers.length).toBe(1)
  })

  it('その月に登場する部位の凡例を表示する', () => {
    setup({
      daysWithWorkouts: new Set(['2026-04-10' as DateString]),
      dayCategories: new Map([
        ['2026-04-10' as DateString, ['chest', 'legs']],
      ]),
    })
    const legend = screen.getByTestId('calendar-legend')
    expect(legend).toBeInTheDocument()
    expect(legend.textContent).toContain('胸')
    expect(legend.textContent).toContain('脚')
  })

  it('部位が無ければ凡例を表示しない', () => {
    setup({ daysWithWorkouts: new Set<DateString>() })
    expect(screen.queryByTestId('calendar-legend')).not.toBeInTheDocument()
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

  describe('余白（密度）', () => {
    it('カードのパディングは p-4・下マージンは mb-6（旧 p-5 / mb-8 ではない）', () => {
      const { container } = render(
        <MonthCalendar
          displayMonth={{ year: 2026, month: 4 }}
          selectedDate={'2026-04-12' as DateString}
          daysWithWorkouts={new Set<DateString>()}
          onPrevMonth={vi.fn()}
          onNextMonth={vi.fn()}
          onSelectDate={vi.fn()}
        />,
      )
      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('p-4')
      expect(card.className).not.toContain('p-5')
      expect(card.className).toContain('mb-6')
      expect(card.className).not.toContain('mb-8')
      // 画面端ガターは mx-page に統一
      expect(card.className).toContain('mx-page')
      expect(card.className).not.toContain('mx-4')
    })
  })

  describe('スクロール月遷移', () => {
    const PANEL_WIDTH = 320

    function getViewport() {
      return screen.getByTestId('calendar-viewport') as HTMLDivElement
    }

    function setProperty(el: HTMLDivElement, prop: string, value: number) {
      Object.defineProperty(el, prop, {
        configurable: true,
        writable: true,
        value,
      })
    }

    it('viewport が snap-x snap-mandatory overflow-x-auto を持つ', () => {
      setup()
      const viewport = getViewport()
      expect(viewport.className).toMatch(/snap-x/)
      expect(viewport.className).toMatch(/snap-mandatory/)
      expect(viewport.className).toMatch(/overflow-x-auto/)
    })

    it('3 つのパネルがそれぞれ snap-start を持つ', () => {
      setup()
      const panels = screen.getAllByTestId('calendar-panel')
      expect(panels).toHaveLength(3)
      panels.forEach((p) => expect(p.className).toMatch(/snap-start/))
    })

    it('viewport を次月位置にスクロールすると onNextMonth が呼ばれる', async () => {
      vi.useFakeTimers()
      const props = setup()
      const viewport = getViewport()
      setProperty(viewport, 'clientWidth', PANEL_WIDTH)
      setProperty(viewport, 'scrollLeft', PANEL_WIDTH * 2)
      fireEvent.scroll(viewport)
      await vi.advanceTimersByTimeAsync(150)
      expect(props.onNextMonth).toHaveBeenCalledOnce()
      expect(props.onPrevMonth).not.toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('viewport を前月位置にスクロールすると onPrevMonth が呼ばれる', async () => {
      vi.useFakeTimers()
      const props = setup()
      const viewport = getViewport()
      setProperty(viewport, 'clientWidth', PANEL_WIDTH)
      setProperty(viewport, 'scrollLeft', 0)
      fireEvent.scroll(viewport)
      await vi.advanceTimersByTimeAsync(150)
      expect(props.onPrevMonth).toHaveBeenCalledOnce()
      expect(props.onNextMonth).not.toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('中央位置 (scrollLeft = clientWidth) では何も呼ばれない', async () => {
      vi.useFakeTimers()
      const props = setup()
      const viewport = getViewport()
      setProperty(viewport, 'clientWidth', PANEL_WIDTH)
      setProperty(viewport, 'scrollLeft', PANEL_WIDTH)
      fireEvent.scroll(viewport)
      await vi.advanceTimersByTimeAsync(150)
      expect(props.onPrevMonth).not.toHaveBeenCalled()
      expect(props.onNextMonth).not.toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('外部 displayMonth 変更でヘッダーが更新される', () => {
      const props = {
        displayMonth: { year: 2026, month: 4 },
        selectedDate: '2026-04-12' as DateString,
        daysWithWorkouts: new Set<DateString>(),
        onPrevMonth: vi.fn(),
        onNextMonth: vi.fn(),
        onSelectDate: vi.fn(),
      }
      const { rerender } = render(<MonthCalendar {...props} />)
      expect(
        screen.getByRole('heading', { level: 2 }).textContent,
      ).toContain('4')
      rerender(
        <MonthCalendar {...props} displayMonth={{ year: 2026, month: 6 }} />,
      )
      expect(
        screen.getByRole('heading', { level: 2 }).textContent,
      ).toContain('6')
    })
  })
})
