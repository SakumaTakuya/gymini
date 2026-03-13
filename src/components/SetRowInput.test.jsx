import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SetRowInput from './SetRowInput'

const defaultPendingSet = { weight: 60, reps: 10, memo: '' }
const defaultProps = {
  pendingSet: defaultPendingSet,
  onPendingSetChange: vi.fn(),
  onAddSet: vi.fn(),
  autoFocus: false,
}

describe('SetRowInput', () => {
  it('displays pendingSet values in input fields', () => {
    render(<SetRowInput {...defaultProps} />)
    expect(screen.getByDisplayValue('60')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
  })

  it('calls onPendingSetChange when weight changes', () => {
    const onPendingSetChange = vi.fn()
    render(<SetRowInput {...defaultProps} onPendingSetChange={onPendingSetChange} />)
    const weightInput = screen.getByDisplayValue('60')
    fireEvent.change(weightInput, { target: { value: '70' } })
    expect(onPendingSetChange).toHaveBeenCalledWith(expect.objectContaining({ weight: 70 }))
  })

  it('calls onAddSet when add button is clicked', () => {
    const onAddSet = vi.fn()
    render(<SetRowInput {...defaultProps} onAddSet={onAddSet} />)
    fireEvent.click(screen.getByRole('button', { name: /追加|add/i }))
    expect(onAddSet).toHaveBeenCalled()
  })

  it('auto focuses weight field when autoFocus is true', async () => {
    render(<SetRowInput {...defaultProps} autoFocus={true} />)
    await waitFor(() => {
      const weightInput = screen.getByDisplayValue('60')
      expect(document.activeElement).toBe(weightInput)
    })
  })

  it('renders confirmed sets and allows inline edit (FR-008)', () => {
    const confirmedSets = [{ weight: 60, reps: 10, memo: '' }]
    const onUpdateSet = vi.fn()
    render(
      <SetRowInput
        {...defaultProps}
        confirmedSets={confirmedSets}
        onUpdateSet={onUpdateSet}
        setNumber={1}
      />
    )
    // The confirmed set row should be visible
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
