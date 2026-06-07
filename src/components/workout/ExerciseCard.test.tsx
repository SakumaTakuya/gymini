import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  ExerciseCard,
  type ExerciseCardSetHandlers,
  type ExerciseCardExerciseHandlers,
} from './ExerciseCard'
import type { DraftExercise } from '../../schemas/workout'
import { makeDraftExercise } from '../../test/fixtures/draftExercise'

const baseDraft = makeDraftExercise({ exerciseId: 'bench' })

function makeProps(
  overrides: {
    draftExercise?: DraftExercise
    setHandlers?: Partial<ExerciseCardSetHandlers>
    exerciseHandlers?: Partial<ExerciseCardExerciseHandlers>
  } = {},
) {
  return {
    draftExercise: overrides.draftExercise ?? baseDraft,
    setHandlers: {
      activate: vi.fn(),
      complete: vi.fn(),
      edit: vi.fn(),
      remove: vi.fn(),
      changeWeight: vi.fn(),
      changeReps: vi.fn(),
      ...(overrides.setHandlers ?? {}),
    },
    exerciseHandlers: {
      remove: vi.fn(),
      toggle: vi.fn(),
      ...(overrides.exerciseHandlers ?? {}),
    },
  }
}

describe('ExerciseCard', () => {
  describe('折りたたみ状態', () => {
    it('セット数サマリー付きのヘッダーのみ表示する', () => {
      const draft: DraftExercise = {
        ...baseDraft,
        cardState: 'collapsed',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 65, reps: 8 },
        ],
      }
      render(<ExerciseCard {...makeProps({ draftExercise: draft })} />)
      expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
      expect(screen.getByText(/2 Sets/)).toBeInTheDocument()
    })

    it('ヘッダークリック時にtoggleを呼び出す', () => {
      const toggle = vi.fn()
      const draft: DraftExercise = { ...baseDraft, cardState: 'collapsed' }
      render(
        <ExerciseCard
          {...makeProps({
            draftExercise: draft,
            exerciseHandlers: { toggle },
          })}
        />,
      )
      fireEvent.click(screen.getByText('ベンチプレス'))
      expect(toggle).toHaveBeenCalledOnce()
    })
  })

  describe('アイドル状態', () => {
    it('完了済みセットと追加ボタンを表示する', () => {
      const draft: DraftExercise = {
        ...baseDraft,
        cardState: 'idle',
        sets: [{ weight: 60, reps: 10 }],
      }
      render(<ExerciseCard {...makeProps({ draftExercise: draft })} />)
      expect(screen.getByText('60')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /追加/ })).toBeInTheDocument()
    })

    it('追加ボタンクリック時に setHandlers.activate を呼び出す', () => {
      const activate = vi.fn()
      render(<ExerciseCard {...makeProps({ setHandlers: { activate } })} />)
      fireEvent.click(screen.getByRole('button', { name: /追加/ }))
      expect(activate).toHaveBeenCalledOnce()
    })
  })

  describe('三点メニュー', () => {
    it('初期状態ではメニューが非表示', () => {
      render(<ExerciseCard {...makeProps()} />)
      expect(screen.queryByText('削除')).not.toBeInTheDocument()
    })

    it('三点ボタンをクリックするとメニューが開く', () => {
      render(<ExerciseCard {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      expect(screen.getByText('削除')).toBeInTheDocument()
    })

    it('削除をクリックすると exerciseHandlers.remove が呼ばれメニューが閉じる', () => {
      const remove = vi.fn()
      render(
        <ExerciseCard {...makeProps({ exerciseHandlers: { remove } })} />,
      )
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      fireEvent.click(screen.getByText('削除'))
      expect(remove).toHaveBeenCalledOnce()
      expect(screen.queryByText('削除')).not.toBeInTheDocument()
    })

    it('exerciseHandlers.moveUp が渡されると「上へ移動」を表示する', () => {
      render(
        <ExerciseCard
          {...makeProps({ exerciseHandlers: { moveUp: vi.fn() } })}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      expect(screen.getByText('上へ移動')).toBeInTheDocument()
    })

    it('moveUp がない場合（先頭種目）は「上へ移動」を表示しない', () => {
      render(
        <ExerciseCard
          {...makeProps({ exerciseHandlers: { moveDown: vi.fn() } })}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      expect(screen.queryByText('上へ移動')).not.toBeInTheDocument()
      expect(screen.getByText('下へ移動')).toBeInTheDocument()
    })

    it('moveDown がない場合（末尾種目）は「下へ移動」を表示しない', () => {
      render(
        <ExerciseCard
          {...makeProps({ exerciseHandlers: { moveUp: vi.fn() } })}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      expect(screen.queryByText('下へ移動')).not.toBeInTheDocument()
      expect(screen.getByText('上へ移動')).toBeInTheDocument()
    })

    it('「上へ移動」をクリックすると moveUp が呼ばれる', () => {
      const moveUp = vi.fn()
      render(
        <ExerciseCard {...makeProps({ exerciseHandlers: { moveUp } })} />,
      )
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      fireEvent.click(screen.getByText('上へ移動'))
      expect(moveUp).toHaveBeenCalledOnce()
    })

    it('「下へ移動」をクリックすると moveDown が呼ばれる', () => {
      const moveDown = vi.fn()
      render(
        <ExerciseCard {...makeProps({ exerciseHandlers: { moveDown } })} />,
      )
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      fireEvent.click(screen.getByText('下へ移動'))
      expect(moveDown).toHaveBeenCalledOnce()
    })

    it('三点ボタンをクリックしても toggle が呼ばれない', () => {
      const toggle = vi.fn()
      render(<ExerciseCard {...makeProps({ exerciseHandlers: { toggle } })} />)
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      expect(toggle).not.toHaveBeenCalled()
    })
  })

  describe('記録中状態', () => {
    it('完了済みセットとpendingセット行を表示する', () => {
      const draft: DraftExercise = {
        ...baseDraft,
        cardState: 'recording',
        sets: [{ weight: 60, reps: 10 }],
        pendingSet: { weight: 60, reps: 10 },
      }
      render(<ExerciseCard {...makeProps({ draftExercise: draft })} />)
      // Completed set
      expect(screen.getByText('60')).toBeInTheDocument()
      // Pending set inputs
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs).toHaveLength(2)
    })
  })

  describe('Matas 紙化（境界線緩和）', () => {
    it('通常種目カードのアウター div に border border-gym-zinc-100 を含まない', () => {
      const { container } = render(<ExerciseCard {...makeProps()} />)
      const outer = container.firstChild as HTMLElement
      expect(outer.className).not.toContain('border border-gym-zinc-100')
    })

    it('展開時のヘッダ div に border-b border-gym-zinc-50 を含まない', () => {
      const draft: DraftExercise = { ...baseDraft, cardState: 'idle' }
      const { container } = render(
        <ExerciseCard {...makeProps({ draftExercise: draft })} />,
      )
      const headerWithBorder = container.querySelector('.border-b')
      expect(headerWithBorder).toBeNull()
    })

    it('shadow-soft は維持する（浮かす表現の唯一の手段）', () => {
      const { container } = render(<ExerciseCard {...makeProps()} />)
      const outer = container.firstChild as HTMLElement
      expect(outer.className).toContain('shadow-soft')
    })
  })
})
