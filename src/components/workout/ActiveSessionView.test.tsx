import type { AnchorHTMLAttributes, PropsWithChildren, ReactNode } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>(
      '@tanstack/react-router',
    )
  return {
    ...actual,
    Link: ({
      children,
      to,
      ...rest
    }: PropsWithChildren<{ to: string; children?: ReactNode } & Record<string, unknown>>) => {
      const { activeProps: _a, inactiveProps: _i, ...domProps } = rest as {
        activeProps?: unknown
        inactiveProps?: unknown
      } & Record<string, unknown>
      void _a
      void _i
      return (
        <a href={to} {...(domProps as AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {children}
        </a>
      )
    },
  }
})

import { ActiveSessionView } from './ActiveSessionView'
import { useWorkoutSessionStore } from '../../stores/workoutSessionStore'
import { useChatStore } from '../../stores/chatStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { DateString, ISODateTimeString } from '../../schemas/date'
import { makeDraftExercise } from '../../test/fixtures/draftExercise'
import { makeChatMessage } from '../../test/fixtures/chatMessage'

function resetStore() {
  useWorkoutSessionStore.setState({
    isActive: false,
    startedAt: null,
    date: null,
    draftExercises: [],
  })
  useChatStore.setState({ messages: [], isLoading: false, error: null })
  useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
}

describe('ActiveSessionView', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
  })

  it('ChatInput（メッセージ入力欄）を末尾に描画する', () => {
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    render(<ActiveSessionView />)
    expect(screen.getByPlaceholderText(/メッセージ.*種目名/)).toBeInTheDocument()
  })

  it('ChatInput 経由で種目を選ぶと ExerciseCard が表示される', async () => {
    const user = userEvent.setup()
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    localStorage.setItem(
      'gymini:exercises',
      JSON.stringify([{ id: 'bench', name: 'ベンチプレス' }]),
    )

    render(<ActiveSessionView />)

    const input = screen.getByPlaceholderText(/メッセージ.*種目名/)
    await user.type(input, 'ベンチ')
    // popover の候補チップ（複数の「ベンチプレス」テキストの最初の button）をクリック
    const chip = screen.getAllByRole('button', { name: 'ベンチプレス' })[0]
    await user.click(chip)

    // ExerciseCard が描画される
    expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(1)
    expect(useWorkoutSessionStore.getState().draftExercises[0].exerciseName).toBe(
      'ベンチプレス',
    )
  })

  it('セッションのUI要素を描画しない（TrainingPage/SessionHeaderに委譲）', () => {
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    render(<ActiveSessionView />)
    expect(screen.queryByRole('button', { name: '終了' })).not.toBeInTheDocument()
    expect(screen.queryByText(/^\d\d:\d\d:\d\d$/)).not.toBeInTheDocument()
  })

  it('PendingSetRow操作で重量・レップ数の更新とcompleteSetを実行できる', async () => {
    const user = userEvent.setup()
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    useWorkoutSessionStore.getState().addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
    render(<ActiveSessionView />)

    // Exercise starts in recording mode → PendingSetRow is visible
    const [weightInput, repsInput] = screen.getAllByRole('spinbutton')

    // onWeightChange
    await user.clear(weightInput)
    await user.type(weightInput, '60')

    // onRepsChange
    await user.clear(repsInput)
    await user.type(repsInput, '10')

    // onComplete (completeSet)
    await user.click(screen.getByRole('button', { name: '完了' }))

    expect(useWorkoutSessionStore.getState().draftExercises[0].sets).toHaveLength(1)
  })

  it('toggleExerciseCardとactivateExerciseを実行できる', async () => {
    const user = userEvent.setup()
    const idleExercise = makeDraftExercise({
      exerciseId: 'squat',
      exerciseName: 'スクワット',
    })
    useWorkoutSessionStore.setState({
      isActive: true,
      date: '2026-03-08' as DateString,
      startedAt: '2026-03-08T10:00:00.000Z' as never,
      draftExercises: [idleExercise],
    })
    render(<ActiveSessionView />)

    // onToggle → collapse the card
    await user.click(screen.getByRole('button', { name: 'スクワット' }))
    expect(useWorkoutSessionStore.getState().draftExercises[0].cardState).toBe('collapsed')

    // onToggle again → expand back to idle
    await user.click(screen.getByRole('button', { name: 'スクワット' }))
    expect(useWorkoutSessionStore.getState().draftExercises[0].cardState).toBe('idle')

    // onActivate → activate recording
    await user.click(screen.getByRole('button', { name: '追加' }))
    expect(useWorkoutSessionStore.getState().draftExercises[0].cardState).toBe('recording')
  })

  it('メニューからdeleteExerciseを実行できる', async () => {
    const user = userEvent.setup()
    useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    useWorkoutSessionStore.getState().addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
    render(<ActiveSessionView />)

    // Open menu
    await user.click(screen.getByRole('button', { name: '種目メニュー' }))
    // Click delete in menu
    await user.click(screen.getByRole('button', { name: /削除/ }))

    expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(0)
  })

  describe('タイムラインレンダ (ChatMessage + DraftExercise)', () => {
    function setupTimeline(items: {
      drafts: Array<{ exerciseName: string; timestamp: string }>
      messages: Array<{ content: string; timestamp: string; role?: 'user' | 'assistant' }>
    }) {
      useWorkoutSessionStore.setState({
        isActive: true,
        date: '2026-05-04' as DateString,
        startedAt: '2026-05-04T19:00:00+09:00' as ISODateTimeString,
        draftExercises: items.drafts.map((d, i) =>
          makeDraftExercise({
            exerciseId: `ex-${i}`,
            exerciseName: d.exerciseName,
            cardState: 'idle',
            timestamp: d.timestamp as ISODateTimeString,
          }),
        ),
      })
      useChatStore.setState({
        messages: items.messages.map((m, i) =>
          makeChatMessage({
            id: `msg-${i}`,
            role: m.role ?? 'assistant',
            content: m.content,
            timestamp: m.timestamp as ISODateTimeString,
          }),
        ),
        isLoading: false,
        error: null,
      })
    }

    it('chatStore.messages と draftExercises を timestamp でマージして時系列で並べる', () => {
      setupTimeline({
        drafts: [
          {
            exerciseName: 'ベンチプレス',
            timestamp: '2026-05-04T19:00:00+09:00',
          },
          {
            exerciseName: 'スクワット',
            timestamp: '2026-05-04T19:10:00+09:00',
          },
        ],
        messages: [
          { content: '間に挟まる AI 応答', timestamp: '2026-05-04T19:05:00+09:00' },
        ],
      })

      const { container } = render(<ActiveSessionView />)
      const visibleText = container.textContent ?? ''
      const benchIdx = visibleText.indexOf('ベンチプレス')
      const aiIdx = visibleText.indexOf('間に挟まる AI 応答')
      const squatIdx = visibleText.indexOf('スクワット')
      expect(benchIdx).toBeGreaterThan(-1)
      expect(aiIdx).toBeGreaterThan(benchIdx)
      expect(squatIdx).toBeGreaterThan(aiIdx)
    })

    it('ChatMessage は ChatBubble、DraftExercise は ExerciseCard で描画される', () => {
      setupTimeline({
        drafts: [
          {
            exerciseName: 'ベンチプレス',
            timestamp: '2026-05-04T19:00:00+09:00',
          },
        ],
        messages: [
          { content: 'こんにちは', timestamp: '2026-05-04T19:01:00+09:00' },
        ],
      })

      render(<ActiveSessionView />)
      // ChatBubble の content
      expect(screen.getByText('こんにちは')).toBeInTheDocument()
      // ExerciseCard の種目名（同じ要素内に AI 提案バッジが無い manual ExerciseCard）
      expect(screen.getByRole('button', { name: 'ベンチプレス' })).toBeInTheDocument()
    })

    it('全ての種目カードが sticky で上部固定される', () => {
      useWorkoutSessionStore.setState({
        isActive: true,
        date: '2026-05-04' as DateString,
        startedAt: '2026-05-04T19:00:00+09:00' as ISODateTimeString,
        draftExercises: [
          makeDraftExercise({
            exerciseId: 'bench',
            exerciseName: 'ベンチプレス',
            cardState: 'idle',
            timestamp: '2026-05-04T19:00:00+09:00' as ISODateTimeString,
          }),
          makeDraftExercise({
            exerciseId: 'squat',
            exerciseName: 'スクワット',
            cardState: 'recording',
            pendingSet: { weight: 0, reps: 0 },
            timestamp: '2026-05-04T19:05:00+09:00' as ISODateTimeString,
          }),
          makeDraftExercise({
            exerciseId: 'dl',
            exerciseName: 'デッドリフト',
            cardState: 'collapsed',
            timestamp: '2026-05-04T19:10:00+09:00' as ISODateTimeString,
          }),
        ],
      })

      const { container } = render(<ActiveSessionView />)
      const stickyEls = container.querySelectorAll('.sticky')
      expect(stickyEls).toHaveLength(3)
      for (const name of ['ベンチプレス', 'スクワット', 'デッドリフト']) {
        const sticky = Array.from(stickyEls).find(
          (el) => within(el as HTMLElement).queryByRole('button', { name }) !== null,
        )
        expect(sticky).toBeDefined()
      }
    })

    it('タイムラインは「種目カード + 次の種目までの ChatMessage」のセクション単位で描画される', () => {
      setupTimeline({
        drafts: [
          { exerciseName: 'ベンチプレス', timestamp: '2026-05-04T19:00:00+09:00' },
          { exerciseName: 'スクワット', timestamp: '2026-05-04T19:10:00+09:00' },
        ],
        messages: [
          { content: 'ベンチ後の AI 応答', timestamp: '2026-05-04T19:05:00+09:00' },
          { content: 'スクワット後の AI 応答', timestamp: '2026-05-04T19:15:00+09:00' },
        ],
      })

      const { container } = render(<ActiveSessionView />)
      const sections = container.querySelectorAll('section')
      expect(sections).toHaveLength(2)
      expect(within(sections[0] as HTMLElement).getByRole('button', { name: 'ベンチプレス' })).toBeInTheDocument()
      expect(within(sections[0] as HTMLElement).getByText('ベンチ後の AI 応答')).toBeInTheDocument()
      expect(within(sections[1] as HTMLElement).getByRole('button', { name: 'スクワット' })).toBeInTheDocument()
      expect(within(sections[1] as HTMLElement).getByText('スクワット後の AI 応答')).toBeInTheDocument()
    })

    it('messages が空でも draftExercises のみで動作する（既存挙動）', () => {
      setupTimeline({
        drafts: [
          {
            exerciseName: 'ベンチプレス',
            timestamp: '2026-05-04T19:00:00+09:00',
          },
        ],
        messages: [],
      })

      render(<ActiveSessionView />)
      expect(screen.getByRole('button', { name: 'ベンチプレス' })).toBeInTheDocument()
    })
  })

  describe('error / APIキーガイダンス (P9)', () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
    })

    it('useChatService.error がセットされたとき ChatInput の直上にバナーを表示する', () => {
      useChatStore.setState({
        messages: [],
        isLoading: false,
        error: 'API 呼び出しに失敗しました',
      })
      render(<ActiveSessionView />)
      expect(screen.getByText('API 呼び出しに失敗しました')).toBeInTheDocument()
    })

    it('error が null のときバナーは表示されない', () => {
      useChatStore.setState({ messages: [], isLoading: false, error: null })
      render(<ActiveSessionView />)
      expect(screen.queryByText(/呼び出しに失敗/)).not.toBeInTheDocument()
    })

    it('hasApiKey === false のとき APIキーガイドカードを表示する', () => {
      useSettingsStore.setState({ apiKey: '', hasApiKey: false })
      render(<ActiveSessionView />)
      expect(screen.getByText('APIキーが必要です')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /設定画面へ/ })).toBeInTheDocument()
    })

    it('error と lastFailedInput がセットされたとき再送ボタンが表示される', () => {
      useChatStore.setState({
        messages: [],
        isLoading: false,
        error: 'ネットワークエラー',
        lastFailedInput: '再送したい',
      })
      render(<ActiveSessionView />)
      expect(screen.getByRole('button', { name: '再送' })).toBeInTheDocument()
    })

    it('lastFailedInput が null のとき再送ボタンは表示されない', () => {
      useChatStore.setState({
        messages: [],
        isLoading: false,
        error: 'ネットワークエラー',
        lastFailedInput: null,
      })
      render(<ActiveSessionView />)
      expect(screen.queryByRole('button', { name: '再送' })).not.toBeInTheDocument()
    })

    it('isLoading=true のとき再送ボタンは disabled になる', () => {
      useChatStore.setState({
        messages: [],
        isLoading: true,
        error: 'ネットワークエラー',
        lastFailedInput: '再送したい',
      })
      render(<ActiveSessionView />)
      expect(screen.getByRole('button', { name: '再送' })).toBeDisabled()
    })

    it('hasApiKey === true のとき APIキーガイドカードは表示されない', () => {
      useSettingsStore.setState({ apiKey: 'k', hasApiKey: true })
      render(<ActiveSessionView />)
      expect(screen.queryByText('APIキーが必要です')).not.toBeInTheDocument()
    })
  })
})
