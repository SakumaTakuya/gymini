import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkoutSummary } from './WorkoutSummary'
import { STAGGER_STEP_MS } from '@/lib/motion'
import type { DateString, ISODateTimeString } from '../schemas/date'
import type { Workout } from '../schemas/workout'

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: '1',
    date: '2026-04-12' as DateString,
    exercises: [
      {
        exerciseId: 'e1',
        exerciseName: 'Bench Press',
        sets: [
          { weight: 100, reps: 10 },
          { weight: 100, reps: 8 },
        ],
      },
    ],
    startedAt: '2026-04-12T10:00:00.000Z' as ISODateTimeString,
    endedAt: '2026-04-12T11:00:00.000Z' as ISODateTimeString,
    createdAt: '2026-04-12T11:00:00.000Z' as ISODateTimeString,
    updatedAt: '2026-04-12T11:00:00.000Z' as ISODateTimeString,
    ...overrides,
  }
}

describe('WorkoutSummary', () => {
  it('日付ヘッダーを表示する', () => {
    render(
      <WorkoutSummary
        date={'2026-04-12' as DateString}
        workouts={[makeWorkout()]}
      />,
    )
    expect(screen.getByText('4月12日の記録')).toBeInTheDocument()
  })

  it('種目名を表示する', () => {
    render(
      <WorkoutSummary
        date={'2026-04-12' as DateString}
        workouts={[makeWorkout()]}
      />,
    )
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
  })

  it('重量とレップ数を含むセットを表示する', () => {
    render(
      <WorkoutSummary
        date={'2026-04-12' as DateString}
        workouts={[makeWorkout()]}
      />,
    )
    expect(screen.getByText('SET1')).toBeInTheDocument()
    expect(screen.getByText('SET2')).toBeInTheDocument()
    // Weight and reps are in separate spans
    expect(screen.getAllByText('100').length).toBe(2)
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('ワークアウト内の複数種目を分けて表示する', () => {
    const workout = makeWorkout({
      exercises: [
        {
          exerciseId: 'e1',
          exerciseName: 'Bench Press',
          sets: [{ weight: 100, reps: 10 }],
        },
        {
          exerciseId: 'e2',
          exerciseName: 'Cable Flyes',
          sets: [{ weight: 30, reps: 12 }],
        },
      ],
    })
    render(
      <WorkoutSummary
        date={'2026-04-12' as DateString}
        workouts={[workout]}
      />,
    )
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('Cable Flyes')).toBeInTheDocument()
  })

  it('カードのパディングは p-4・下マージンは mb-4（旧 p-5 / mb-6 ではない）', () => {
    const { container } = render(
      <WorkoutSummary
        date={'2026-04-12' as DateString}
        workouts={[makeWorkout()]}
      />,
    )
    const card = container.querySelector('.shadow-soft') as HTMLElement
    expect(card).not.toBeNull()
    expect(card.className).toContain('p-4')
    expect(card.className).not.toContain('p-5')
    expect(card.className).toContain('mb-4')
    expect(card.className).not.toContain('mb-6')
  })

  it('カード・見出しの画面端ガターは px-page/mx-page に統一されている', () => {
    const { container } = render(
      <WorkoutSummary
        date={'2026-04-12' as DateString}
        workouts={[makeWorkout()]}
      />,
    )
    // 見出しは px-page、カードは mx-page。生の px-6 / mx-4 を残さない
    const header = container.querySelector('h3')!.parentElement as HTMLElement
    expect(header.className).toContain('px-page')
    expect(header.className).not.toContain('px-6')
    const card = container.querySelector('.shadow-soft') as HTMLElement
    expect(card.className).toContain('mx-page')
    expect(card.className).not.toContain('mx-4')
  })

  it('種目間のギャップは gap-3（旧 gap-4 ではない）', () => {
    const workout = makeWorkout({
      exercises: [
        {
          exerciseId: 'e1',
          exerciseName: 'Bench Press',
          sets: [{ weight: 100, reps: 10 }],
        },
        {
          exerciseId: 'e2',
          exerciseName: 'Cable Flyes',
          sets: [{ weight: 30, reps: 12 }],
        },
      ],
    })
    const { container } = render(
      <WorkoutSummary date={'2026-04-12' as DateString} workouts={[workout]} />,
    )
    // Card ラッパー（.shadow-soft）の直下に種目を並べる flex-col コンテナがある
    const card = container.querySelector('.shadow-soft') as HTMLElement
    const inner = card.firstElementChild as HTMLElement
    expect(inner).not.toBeNull()
    expect(inner.className).toContain('gap-3')
    expect(inner.className).not.toContain('gap-4')
  })

  it('各ワークアウトカードは共通の出現アニメ(animate-appear)でラップされる', () => {
    const w1 = makeWorkout({ id: '1' })
    const w2 = makeWorkout({ id: '2' })
    const { container } = render(
      <WorkoutSummary date={'2026-04-12' as DateString} workouts={[w1, w2]} />,
    )
    const appeared = container.querySelectorAll('.animate-appear')
    expect(appeared.length).toBe(2)
    // 2 枚目は stagger 遅延が付く
    const second = appeared[1] as HTMLElement
    expect(second.style.animationDelay).toBe(`${STAGGER_STEP_MS}ms`)
  })

  it('複数のワークアウトをそれぞれ別のセクションで描画する', () => {
    const w1 = makeWorkout({ id: '1' })
    const w2 = makeWorkout({
      id: '2',
      exercises: [
        {
          exerciseId: 'e2',
          exerciseName: 'Squat',
          sets: [{ weight: 120, reps: 5 }],
        },
      ],
    })
    render(
      <WorkoutSummary
        date={'2026-04-12' as DateString}
        workouts={[w1, w2]}
      />,
    )
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('Squat')).toBeInTheDocument()
  })
})
