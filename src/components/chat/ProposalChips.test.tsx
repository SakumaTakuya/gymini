import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProposalChips } from './ProposalChips'
import type { ProposedAction } from '../../types/chat'

const actions: ProposedAction[] = [
  {
    id: 'a1',
    label: 'ベンチプレスを始める',
    kind: 'start-exercise',
    payload: { exerciseName: 'ベンチプレス' },
  },
  {
    id: 'a2',
    label: '前回履歴を見る',
    kind: 'show-history',
    payload: { exerciseName: 'ベンチプレス' },
  },
  {
    id: 'a3',
    label: '別の種目を聞く',
    kind: 'ask-followup',
    payload: { prompt: '別の種目を提案して' },
  },
]

describe('ProposalChips', () => {
  it('全 chip がラベル付きのボタンとして描画される', () => {
    render(<ProposalChips actions={actions} onClick={() => {}} />)
    expect(
      screen.getByRole('button', { name: /ベンチプレスを始める/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /前回履歴を見る/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /別の種目を聞く/ }),
    ).toBeInTheDocument()
  })

  it('chip クリックで onClick が action 引数で呼ばれる', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<ProposalChips actions={actions} onClick={onClick} />)
    await user.click(screen.getByRole('button', { name: /前回履歴を見る/ }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenCalledWith(actions[1])
  })

  it('consumedActionId があるとき全 chip が disabled になる', () => {
    render(
      <ProposalChips
        actions={actions}
        consumedActionId="a1"
        onClick={() => {}}
      />,
    )
    for (const a of actions) {
      expect(
        screen.getByRole('button', { name: new RegExp(a.label) }),
      ).toBeDisabled()
    }
  })

  it('consumedActionId が disabled の chip をクリックしても onClick は呼ばれない', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <ProposalChips
        actions={actions}
        consumedActionId="a1"
        onClick={onClick}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: /ベンチプレスを始める/ }),
    )
    expect(onClick).not.toHaveBeenCalled()
  })

  it('バブル本文との上マージンは mt-2（旧 mt-3 ではない）', () => {
    const { container } = render(
      <ProposalChips actions={actions} onClick={() => {}} />,
    )
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain('mt-2')
    expect(root.className).not.toContain('mt-3')
  })

  it('actions が空のとき何も描画しない（root が null）', () => {
    const { container } = render(
      <ProposalChips actions={[]} onClick={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })
})
