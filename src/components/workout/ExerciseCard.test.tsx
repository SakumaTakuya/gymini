import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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

  describe('カード本文の高さ制御（FR_036）', () => {
    it('完了セット一覧は max-h + overflow-y-auto のスクロール領域に入る', () => {
      const draft: DraftExercise = {
        ...baseDraft,
        cardState: 'idle',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 60, reps: 9 },
        ],
      }
      render(<ExerciseCard {...makeProps({ draftExercise: draft })} />)
      const scroll = screen.getByTestId('sets-scroll')
      expect(scroll.className).toContain('overflow-y-auto')
      expect(scroll.className).toMatch(/max-h-/)
      expect(within(scroll).getAllByTestId('completed-set-row')).toHaveLength(2)
    })

    it('記録中（新規）は pending 行をスクロール領域の外に出し常時可視にする', () => {
      const draft: DraftExercise = {
        ...baseDraft,
        cardState: 'recording',
        sets: [{ weight: 60, reps: 10 }],
        pendingSet: { weight: 60, reps: 10 },
        editingSetIndex: null,
      }
      render(<ExerciseCard {...makeProps({ draftExercise: draft })} />)
      const scroll = screen.getByTestId('sets-scroll')
      // 完了行はスクロール領域内
      expect(within(scroll).getAllByTestId('completed-set-row')).toHaveLength(1)
      // pending 入力（spinbutton）はスクロール領域の外に出ている
      expect(within(scroll).queryAllByRole('spinbutton')).toHaveLength(0)
      expect(screen.getAllByRole('spinbutton')).toHaveLength(2)
    })

    it('記録中（編集）は pending 行を編集位置（スクロール領域内）に挿入する', () => {
      const draft: DraftExercise = {
        ...baseDraft,
        cardState: 'recording',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 65, reps: 8 },
        ],
        pendingSet: { weight: 60, reps: 10 },
        editingSetIndex: 0,
      }
      render(<ExerciseCard {...makeProps({ draftExercise: draft })} />)
      const scroll = screen.getByTestId('sets-scroll')
      // 編集中は入力行がスクロール領域の中に挿入される
      expect(within(scroll).getAllByRole('spinbutton')).toHaveLength(2)
    })

    it('記録中（編集）でも表示上のセット番号が重複しない', () => {
      // sets: [A, B, C] の B（index 1）を編集 → 表示は 1 / 2(入力行) / 3 になるべき。
      // 回帰: 編集行の後ろのセットが編集行と同じ番号（2, 2）で表示されていた。
      const draft: DraftExercise = {
        ...baseDraft,
        cardState: 'recording',
        sets: [
          { weight: 60, reps: 10 }, // A（元 index 0）
          { weight: 70, reps: 6 },  // C（元 index 2。B は編集中で配列から除外済み）
        ],
        pendingSet: { weight: 65, reps: 8 }, // B（編集中）
        editingSetIndex: 1,
      }
      render(<ExerciseCard {...makeProps({ draftExercise: draft })} />)
      const scroll = screen.getByTestId('sets-scroll')
      // 完了行の番号（ウォーターマーク）は 1 と 3、編集中の入力行が 2 を持つ
      const completedNumbers = within(scroll)
        .getAllByTestId('completed-set-watermark')
        .map((el) => el.textContent)
      expect(completedNumbers).toEqual(['1', '3'])
      expect(within(scroll).getByText('2')).toBeInTheDocument()
    })
  })

  describe('余白（密度）', () => {
    it('アウター div のパディングは p-4（旧 p-5 ではない）', () => {
      const { container } = render(<ExerciseCard {...makeProps()} />)
      const outer = container.firstChild as HTMLElement
      expect(outer.className).toContain('p-4')
      expect(outer.className).not.toContain('p-5')
    })

    it('画面端ガターは mx-page に統一されている', () => {
      const { container } = render(<ExerciseCard {...makeProps()} />)
      const outer = container.firstChild as HTMLElement
      expect(outer.className).toContain('mx-page')
      expect(outer.className).not.toContain('mx-4')
    })

    it('展開時のヘッダ行の下マージンは mb-3（旧 mb-4 ではない）', () => {
      const draft: DraftExercise = { ...baseDraft, cardState: 'idle' }
      const { container } = render(
        <ExerciseCard {...makeProps({ draftExercise: draft })} />,
      )
      // ヘッダ行はアウター直下の最初の div
      const header = (container.firstChild as HTMLElement)
        .firstElementChild as HTMLElement
      expect(header.className).toContain('mb-3')
      expect(header.className).not.toContain('mb-4')
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

describe('ExerciseCard 重量提案チップ', () => {
  const recordingDraft: DraftExercise = {
    ...baseDraft,
    cardState: 'recording',
    sets: [],
    pendingSet: { weight: 0, reps: 0 },
    editingSetIndex: null,
  }
  const suggestions = [
    { weight: 62.5, reps: 8 },
    { weight: 60, reps: 10 },
  ]

  it('1セット目の記録中（新規）に suggestions があればチップを表示する', () => {
    render(
      <ExerciseCard
        {...makeProps({ draftExercise: recordingDraft })}
        suggestions={suggestions}
      />,
    )
    expect(screen.getByText('推奨')).toBeInTheDocument()
    expect(screen.getByText('62.5')).toBeInTheDocument()
  })

  it('suggestions が空ならチップを表示しない', () => {
    render(
      <ExerciseCard
        {...makeProps({ draftExercise: recordingDraft })}
        suggestions={[]}
      />,
    )
    expect(screen.queryByText('推奨')).not.toBeInTheDocument()
  })

  it('完了済みセットがある場合（2セット目以降）は表示しない', () => {
    const draft: DraftExercise = {
      ...recordingDraft,
      sets: [{ weight: 60, reps: 8 }],
    }
    render(
      <ExerciseCard
        {...makeProps({ draftExercise: draft })}
        suggestions={suggestions}
      />,
    )
    expect(screen.queryByText('推奨')).not.toBeInTheDocument()
  })

  it('既存セットの編集中は表示しない', () => {
    const draft: DraftExercise = {
      ...recordingDraft,
      sets: [{ weight: 60, reps: 8 }],
      editingSetIndex: 0,
    }
    render(
      <ExerciseCard
        {...makeProps({ draftExercise: draft })}
        suggestions={suggestions}
      />,
    )
    expect(screen.queryByText('推奨')).not.toBeInTheDocument()
  })

  it('チップをタップすると changeWeight と changeReps が呼ばれる', () => {
    const props = makeProps({ draftExercise: recordingDraft })
    render(<ExerciseCard {...props} suggestions={suggestions} />)
    fireEvent.click(screen.getByRole('button', { name: '62.5kg × 8回を入力' }))
    expect(props.setHandlers.changeWeight).toHaveBeenCalledWith(62.5)
    expect(props.setHandlers.changeReps).toHaveBeenCalledWith(8)
  })
})
