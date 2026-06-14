import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GymCard } from './GymCard'

describe('GymCard', () => {
  it('既定は solid・size=default で 角丸/白背景/影/p-4 を内包する', () => {
    const { container } = render(<GymCard>本文</GymCard>)
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain('rounded-[24px]')
    expect(root.className).toContain('bg-gym-white')
    expect(root.className).toContain('shadow-soft')
    expect(root.className).toContain('p-4')
  })

  it('size=sm は p-3（密なカード）', () => {
    const { container } = render(<GymCard size="sm">本文</GymCard>)
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain('p-3')
    expect(root.className).not.toContain('p-4')
  })

  it('variant=dashed は透明背景+破線・影を持たない（プレースホルダ）', () => {
    const { container } = render(<GymCard variant="dashed">空</GymCard>)
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain('border-dashed')
    expect(root.className).not.toContain('shadow-soft')
    expect(root.className).not.toContain('bg-gym-white')
  })

  it('className で配置・境界線を付与でき、内側 padding は呼び出し側で上書きできる', () => {
    const { container } = render(
      <GymCard className="mx-page mb-4 border border-gym-zinc-100">x</GymCard>,
    )
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain('mx-page')
    expect(root.className).toContain('mb-4')
    expect(root.className).toContain('border-gym-zinc-100')
    // 内包 padding は維持
    expect(root.className).toContain('p-4')
  })

  it('任意の div 属性（data-testid 等）を透過する', () => {
    const { getByTestId } = render(
      <GymCard data-testid="my-card">x</GymCard>,
    )
    expect(getByTestId('my-card')).toBeInTheDocument()
  })
})
