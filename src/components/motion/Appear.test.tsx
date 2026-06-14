import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { setupHapticMocks } from '@/test/hapticMocks'
import { STAGGER_STEP_MS } from '@/lib/motion'
import { Appear } from './Appear'

describe('Appear', () => {
  it('子を描画し animate-appear を付与', () => {
    const { restore } = setupHapticMocks({ reducedMotion: false })
    render(<Appear data-testid="a">中身</Appear>)
    const el = screen.getByTestId('a')
    expect(el).toHaveTextContent('中身')
    expect(el.className).toContain('animate-appear')
    restore()
  })

  it('呼び出し側 className をマージ', () => {
    const { restore } = setupHapticMocks({ reducedMotion: false })
    render(
      <Appear data-testid="a" className="mx-page">
        x
      </Appear>,
    )
    const el = screen.getByTestId('a')
    expect(el.className).toContain('animate-appear')
    expect(el.className).toContain('mx-page')
    restore()
  })

  it('index>0 で animationDelay を style に付与', () => {
    const { restore } = setupHapticMocks({ reducedMotion: false })
    render(
      <Appear data-testid="a" index={3}>
        x
      </Appear>,
    )
    const el = screen.getByTestId('a') as HTMLElement
    expect(el.style.animationDelay).toBe(`${3 * STAGGER_STEP_MS}ms`)
    restore()
  })

  it('reduced-motion 時は animate-appear を付けない', () => {
    const { restore } = setupHapticMocks({ reducedMotion: true })
    render(<Appear data-testid="a">x</Appear>)
    const el = screen.getByTestId('a')
    expect(el.className).not.toContain('animate-appear')
    restore()
  })

  it('as で要素種別を変更できる', () => {
    const { restore } = setupHapticMocks({ reducedMotion: false })
    render(
      <Appear as="li" data-testid="a">
        x
      </Appear>,
    )
    expect(screen.getByTestId('a').tagName).toBe('LI')
    restore()
  })
})
