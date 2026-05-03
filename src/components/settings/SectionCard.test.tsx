import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionCard } from './SectionCard'

describe('SectionCard', () => {
  it('子要素を描画する', () => {
    render(
      <SectionCard>
        <span>inner</span>
      </SectionCard>,
    )
    expect(screen.getByText('inner')).toBeInTheDocument()
  })

  it('カードにFRAME5ビジュアル仕様のクラスを適用する', () => {
    render(
      <SectionCard data-testid="card">
        <span />
      </SectionCard>,
    )
    const card = screen.getByTestId('card')
    expect(card.className).toContain('bg-gym-white')
    expect(card.className).toContain('rounded-[20px]')
    expect(card.className).toContain('shadow-soft')
    expect(card.className).toContain('border-gym-zinc-100')
    expect(card.className).toContain('overflow-hidden')
  })

  it('追加のclassNameをマージする', () => {
    render(
      <SectionCard data-testid="card" className="mt-6">
        <span />
      </SectionCard>,
    )
    expect(screen.getByTestId('card').className).toContain('mt-6')
  })

  it('カード外にuppercase tracking-widestスタイルのラベルを描画する', () => {
    render(
      <SectionCard label="Gemini API" data-testid="card">
        <span>body</span>
      </SectionCard>,
    )
    const label = screen.getByText('Gemini API')
    expect(label.className).toContain('uppercase')
    expect(label.className).toContain('tracking-widest')
    // ラベルはカード（data-testid="card"）の外に配置される
    const card = screen.getByTestId('card')
    expect(card.contains(label)).toBe(false)
  })

  it('labelが指定されていない場合はラベルラッパーを省略する', () => {
    const { container } = render(
      <SectionCard data-testid="card">
        <span>body</span>
      </SectionCard>,
    )
    // section ラッパーが生成されないことを検証
    expect(container.querySelector('section')).toBeNull()
  })
})
