import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExerciseCard } from './ExerciseCard'
import type { DraftExercise } from '../../schemas/workout'
import { makeDraftExercise } from '../../test/fixtures/draftExercise'
import { firePointer } from '../../test/pointerEvents'

const baseDraft = makeDraftExercise({ exerciseId: 'bench' })

const defaultProps = {
  draftExercise: baseDraft,
  onActivate: vi.fn(),
  onComplete: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onDeleteExercise: vi.fn(),
  onToggle: vi.fn(),
  onWeightChange: vi.fn(),
  onRepsChange: vi.fn(),
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
      render(<ExerciseCard {...defaultProps} draftExercise={draft} />)
      expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
      expect(screen.getByText(/2 Sets/)).toBeInTheDocument()
    })

    it('ヘッダークリック時にonToggleを呼び出す', () => {
      const onToggle = vi.fn()
      const draft: DraftExercise = { ...baseDraft, cardState: 'collapsed' }
      render(
        <ExerciseCard {...defaultProps} draftExercise={draft} onToggle={onToggle} />,
      )
      fireEvent.click(screen.getByText('ベンチプレス'))
      expect(onToggle).toHaveBeenCalledOnce()
    })
  })

  describe('アイドル状態', () => {
    it('完了済みセットと追加ボタンを表示する', () => {
      const draft: DraftExercise = {
        ...baseDraft,
        cardState: 'idle',
        sets: [{ weight: 60, reps: 10 }],
      }
      render(<ExerciseCard {...defaultProps} draftExercise={draft} />)
      expect(screen.getByText('60')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /追加/ })).toBeInTheDocument()
    })

    it('追加ボタンクリック時にonActivateを呼び出す', () => {
      const onActivate = vi.fn()
      render(
        <ExerciseCard {...defaultProps} onActivate={onActivate} />,
      )
      fireEvent.click(screen.getByRole('button', { name: /追加/ }))
      expect(onActivate).toHaveBeenCalledOnce()
    })
  })

  describe('三点メニュー', () => {
    it('初期状態ではメニューが非表示', () => {
      render(<ExerciseCard {...defaultProps} />)
      expect(screen.queryByText('削除')).not.toBeInTheDocument()
    })

    it('三点ボタンをクリックするとメニューが開く', () => {
      render(<ExerciseCard {...defaultProps} />)
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      expect(screen.getByText('削除')).toBeInTheDocument()
    })

    it('削除をクリックすると onDeleteExercise が呼ばれメニューが閉じる', () => {
      const onDeleteExercise = vi.fn()
      render(<ExerciseCard {...defaultProps} onDeleteExercise={onDeleteExercise} />)
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      fireEvent.click(screen.getByText('削除'))
      expect(onDeleteExercise).toHaveBeenCalledOnce()
      expect(screen.queryByText('削除')).not.toBeInTheDocument()
    })

    it('onMoveUp が渡されると「上へ移動」を表示する', () => {
      render(<ExerciseCard {...defaultProps} onMoveUp={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      expect(screen.getByText('上へ移動')).toBeInTheDocument()
    })

    it('onMoveUp がない場合（先頭種目）は「上へ移動」を表示しない', () => {
      render(<ExerciseCard {...defaultProps} onMoveDown={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      expect(screen.queryByText('上へ移動')).not.toBeInTheDocument()
      expect(screen.getByText('下へ移動')).toBeInTheDocument()
    })

    it('onMoveDown がない場合（末尾種目）は「下へ移動」を表示しない', () => {
      render(<ExerciseCard {...defaultProps} onMoveUp={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      expect(screen.queryByText('下へ移動')).not.toBeInTheDocument()
      expect(screen.getByText('上へ移動')).toBeInTheDocument()
    })

    it('「上へ移動」をクリックすると onMoveUp が呼ばれる', () => {
      const onMoveUp = vi.fn()
      render(<ExerciseCard {...defaultProps} onMoveUp={onMoveUp} />)
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      fireEvent.click(screen.getByText('上へ移動'))
      expect(onMoveUp).toHaveBeenCalledOnce()
    })

    it('「下へ移動」をクリックすると onMoveDown が呼ばれる', () => {
      const onMoveDown = vi.fn()
      render(<ExerciseCard {...defaultProps} onMoveDown={onMoveDown} />)
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      fireEvent.click(screen.getByText('下へ移動'))
      expect(onMoveDown).toHaveBeenCalledOnce()
    })

    it('三点ボタンをクリックしても onToggle が呼ばれない', () => {
      const onToggle = vi.fn()
      render(<ExerciseCard {...defaultProps} onToggle={onToggle} />)
      fireEvent.click(screen.getByRole('button', { name: '種目メニュー' }))
      expect(onToggle).not.toHaveBeenCalled()
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
      render(<ExerciseCard {...defaultProps} draftExercise={draft} />)
      // Completed set
      expect(screen.getByText('60')).toBeInTheDocument()
      // Pending set inputs
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs).toHaveLength(2)
    })
  })

  describe('AI 提案バリアント (origin: ai-suggested)', () => {
    const aiDraft = makeDraftExercise({
      exerciseId: 'bench',
      origin: 'ai-suggested',
      sets: [{ weight: 60, reps: 10 }],
    })

    it('AI 提案バッジを表示する', () => {
      render(<ExerciseCard {...defaultProps} draftExercise={aiDraft} />)
      expect(screen.getByText(/AI 提案/)).toBeInTheDocument()
    })

    it('内部に SingleExerciseEditor をマウントし initialSets を表示する', () => {
      render(<ExerciseCard {...defaultProps} draftExercise={aiDraft} />)
      expect(screen.getByDisplayValue('60')).toBeInTheDocument()
      expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    })

    it('「保存」ボタンクリックで onAcceptSuggested に編集後 sets を渡す', () => {
      const onAcceptSuggested = vi.fn()
      render(
        <ExerciseCard
          {...defaultProps}
          draftExercise={aiDraft}
          onAcceptSuggested={onAcceptSuggested}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: /保存/ }))
      expect(onAcceptSuggested).toHaveBeenCalledWith([{ weight: 60, reps: 10 }])
    })

    it('編集して「保存」すると編集後 sets が onAcceptSuggested に渡る', () => {
      const onAcceptSuggested = vi.fn()
      render(
        <ExerciseCard
          {...defaultProps}
          draftExercise={aiDraft}
          onAcceptSuggested={onAcceptSuggested}
        />,
      )
      const inputs = screen.getAllByRole('spinbutton')
      fireEvent.change(inputs[0], { target: { value: '80' } })
      fireEvent.click(screen.getByRole('button', { name: /保存/ }))
      expect(onAcceptSuggested).toHaveBeenCalledWith([{ weight: 80, reps: 10 }])
    })

    it('「キャンセル」ボタンクリックで onRejectSuggested を呼ぶ', () => {
      const onRejectSuggested = vi.fn()
      render(
        <ExerciseCard
          {...defaultProps}
          draftExercise={aiDraft}
          onRejectSuggested={onRejectSuggested}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
      expect(onRejectSuggested).toHaveBeenCalledOnce()
    })

    it('origin: manual のときは AI 提案バッジを表示しない', () => {
      render(<ExerciseCard {...defaultProps} />)
      expect(screen.queryByText(/AI 提案/)).not.toBeInTheDocument()
    })

    describe('swipe handle 拡張 (Phase 9b)', () => {
      it('handle は min-h-[44px] でモバイルタップ領域を確保する', () => {
        render(<ExerciseCard {...defaultProps} draftExercise={aiDraft} />)
        const handle = screen.getByTestId('ai-card-handle')
        expect(handle.className).toContain('min-h-[44px]')
      })

      it('handle に種目名を含む (見出しごと掴める)', () => {
        render(<ExerciseCard {...defaultProps} draftExercise={aiDraft} />)
        const handle = screen.getByTestId('ai-card-handle')
        expect(handle.textContent).toContain('ベンチプレス')
      })

      it('種目名は handle 内で 1 度だけ表示される (SingleExerciseEditor 側は非表示)', () => {
        render(<ExerciseCard {...defaultProps} draftExercise={aiDraft} />)
        expect(screen.getAllByText('ベンチプレス')).toHaveLength(1)
      })
    })

    describe('Badeen swipe accept/reject (Phase 8b)', () => {
      it('handle を右 swipe すると onAcceptSuggested に initialSets が渡る (編集なしクイック承認)', () => {
        const onAcceptSuggested = vi.fn()
        render(
          <ExerciseCard
            {...defaultProps}
            draftExercise={aiDraft}
            onAcceptSuggested={onAcceptSuggested}
          />,
        )
        const handle = screen.getByTestId('ai-card-handle')
        firePointer(handle, 'pointerdown', { clientX: 0 })
        firePointer(handle, 'pointermove', { clientX: 200 })
        firePointer(handle, 'pointerup', { clientX: 200 })
        expect(onAcceptSuggested).toHaveBeenCalledWith([{ weight: 60, reps: 10 }])
      })

      it('handle を左 swipe すると onRejectSuggested が呼ばれる', () => {
        const onRejectSuggested = vi.fn()
        render(
          <ExerciseCard
            {...defaultProps}
            draftExercise={aiDraft}
            onRejectSuggested={onRejectSuggested}
          />,
        )
        const handle = screen.getByTestId('ai-card-handle')
        firePointer(handle, 'pointerdown', { clientX: 300 })
        firePointer(handle, 'pointermove', { clientX: 100 })
        firePointer(handle, 'pointerup', { clientX: 100 })
        expect(onRejectSuggested).toHaveBeenCalledOnce()
      })

      it('フォーム内の input を touch しても swipe は起動しない (handle 外なので)', () => {
        const onAcceptSuggested = vi.fn()
        const onRejectSuggested = vi.fn()
        render(
          <ExerciseCard
            {...defaultProps}
            draftExercise={aiDraft}
            onAcceptSuggested={onAcceptSuggested}
            onRejectSuggested={onRejectSuggested}
          />,
        )
        const input = screen.getAllByRole('spinbutton')[0]
        firePointer(input, 'pointerdown', { clientX: 100 })
        firePointer(input, 'pointermove', { clientX: 300 })
        firePointer(input, 'pointerup', { clientX: 300 })
        expect(onAcceptSuggested).not.toHaveBeenCalled()
        expect(onRejectSuggested).not.toHaveBeenCalled()
      })

      it('既存の「保存」ボタン経路も維持される (キーボードユーザー向け)', () => {
        const onAcceptSuggested = vi.fn()
        render(
          <ExerciseCard
            {...defaultProps}
            draftExercise={aiDraft}
            onAcceptSuggested={onAcceptSuggested}
          />,
        )
        fireEvent.click(screen.getByRole('button', { name: /保存/ }))
        expect(onAcceptSuggested).toHaveBeenCalledOnce()
      })
    })
  })

  describe('Matas 紙化（境界線緩和）', () => {
    it('通常種目カードのアウター div に border border-gym-zinc-100 を含まない', () => {
      const { container } = render(<ExerciseCard {...defaultProps} />)
      const outer = container.firstChild as HTMLElement
      expect(outer.className).not.toContain('border border-gym-zinc-100')
    })

    it('展開時のヘッダ div に border-b border-gym-zinc-50 を含まない', () => {
      const draft: DraftExercise = { ...baseDraft, cardState: 'idle' }
      const { container } = render(<ExerciseCard {...defaultProps} draftExercise={draft} />)
      const headerWithBorder = container.querySelector('.border-b')
      expect(headerWithBorder).toBeNull()
    })

    it('shadow-soft は維持する（浮かす表現の唯一の手段）', () => {
      const { container } = render(<ExerciseCard {...defaultProps} />)
      const outer = container.firstChild as HTMLElement
      expect(outer.className).toContain('shadow-soft')
    })
  })
})
