import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IdleView from './IdleView'

describe('IdleView', () => {
  it('renders start training button', () => {
    render(<IdleView onStartTraining={() => {}} onOpenSettings={() => {}} />)
    expect(screen.getByRole('button', { name: /トレーニングを開始/i })).toBeInTheDocument()
  })

  it('calls onStartTraining when start button is clicked', async () => {
    const onStart = vi.fn()
    render(<IdleView onStartTraining={onStart} onOpenSettings={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /トレーニングを開始/i }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('calls onOpenSettings when settings button is clicked', async () => {
    const onSettings = vi.fn()
    render(<IdleView onStartTraining={() => {}} onOpenSettings={onSettings} />)
    await userEvent.click(screen.getByRole('button', { name: /設定/i }))
    expect(onSettings).toHaveBeenCalledOnce()
  })

  it('start button meets minimum tap target size', () => {
    render(<IdleView onStartTraining={() => {}} onOpenSettings={() => {}} />)
    const btn = screen.getByRole('button', { name: /トレーニングを開始/i })
    expect(btn.className).toMatch(/min-h-\[44px\]/)
  })
})
