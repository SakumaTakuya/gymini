import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IdleView } from './IdleView'

describe('IdleView', () => {
  it('renders start training button', () => {
    render(<IdleView onStartTraining={vi.fn()} />)
    expect(
      screen.getByRole('button', { name: /トレーニングを始める/ }),
    ).toBeInTheDocument()
  })

  it('calls onStartTraining when button is clicked', () => {
    const onStartTraining = vi.fn()
    render(<IdleView onStartTraining={onStartTraining} />)
    fireEvent.click(
      screen.getByRole('button', { name: /トレーニングを始める/ }),
    )
    expect(onStartTraining).toHaveBeenCalledOnce()
  })

  it('button has proper size for tap target', () => {
    render(<IdleView onStartTraining={vi.fn()} />)
    const button = screen.getByRole('button', { name: /トレーニングを始める/ })
    expect(button.className).toContain('h-13')
  })
})
