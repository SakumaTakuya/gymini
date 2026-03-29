import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExerciseMasterPage from './ExerciseMasterPage'

const STORAGE_KEY = 'gymini:exercises'

beforeEach(() => {
  localStorage.clear()
  const exercises = [
    { id: 'bench-press', name: 'ベンチプレス' },
    { id: 'squat', name: 'スクワット' },
  ]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises))
})

describe('ExerciseMasterPage', () => {
  it('displays exercise list on mount', () => {
    render(<ExerciseMasterPage />)
    expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
    expect(screen.getByText('スクワット')).toBeInTheDocument()
  })

  it('adds a new exercise via form', async () => {
    render(<ExerciseMasterPage />)
    const input = screen.getByPlaceholderText('種目名を入力...')
    await userEvent.type(input, 'デッドリフト')
    await userEvent.click(screen.getByRole('button', { name: /追加/ }))
    expect(screen.getByText('デッドリフト')).toBeInTheDocument()
  })

  it('clears input after successful add', async () => {
    render(<ExerciseMasterPage />)
    const input = screen.getByPlaceholderText('種目名を入力...')
    await userEvent.type(input, 'デッドリフト')
    await userEvent.click(screen.getByRole('button', { name: /追加/ }))
    expect(input).toHaveValue('')
  })

  it('shows error on duplicate name', async () => {
    render(<ExerciseMasterPage />)
    const input = screen.getByPlaceholderText('種目名を入力...')
    await userEvent.type(input, 'ベンチプレス')
    await userEvent.click(screen.getByRole('button', { name: /追加/ }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('removes an exercise when delete button is clicked', async () => {
    render(<ExerciseMasterPage />)
    const deleteButtons = screen.getAllByRole('button', { name: /削除/ })
    await userEvent.click(deleteButtons[0])
    expect(screen.queryByText('ベンチプレス')).not.toBeInTheDocument()
    expect(screen.getByText('スクワット')).toBeInTheDocument()
  })

  it('shows page title', () => {
    render(<ExerciseMasterPage />)
    expect(screen.getByText('種目マスター')).toBeInTheDocument()
  })
})
