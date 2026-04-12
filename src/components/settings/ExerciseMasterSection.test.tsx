import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExerciseMasterSection } from './ExerciseMasterSection'
import * as exerciseRepository from '@/lib/exerciseRepository'

describe('ExerciseMasterSection', () => {
  beforeEach(() => {
    localStorage.clear()
    exerciseRepository.create('ベンチプレス')
    exerciseRepository.create('スクワット')
    exerciseRepository.create('デッドリフト')
  })

  it('displays 種目マスター section label', () => {
    render(<ExerciseMasterSection />)
    expect(screen.getByText('種目マスター')).toBeInTheDocument()
  })

  it('lists all exercises initially', () => {
    render(<ExerciseMasterSection />)
    expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
    expect(screen.getByText('スクワット')).toBeInTheDocument()
    expect(screen.getByText('デッドリフト')).toBeInTheDocument()
  })

  it('filters exercises in real-time as user types', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)
    const search = screen.getByPlaceholderText('種目を検索...')

    await user.type(search, 'ベンチ')

    expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
    expect(screen.queryByText('スクワット')).not.toBeInTheDocument()
    expect(screen.queryByText('デッドリフト')).not.toBeInTheDocument()
  })

  it('adds new exercise via add button', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)

    await user.click(screen.getByRole('button', { name: '種目を追加' }))
    const newInput = screen.getByLabelText('新しい種目名')
    await user.type(newInput, 'チンニング')
    await user.click(screen.getByRole('button', { name: '追加を確定' }))

    expect(screen.getByText('チンニング')).toBeInTheDocument()
    expect(exerciseRepository.getAll().some((e) => e.name === 'チンニング')).toBe(true)
  })

  it('does not add empty exercise name', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)

    await user.click(screen.getByRole('button', { name: '種目を追加' }))
    await user.click(screen.getByRole('button', { name: '追加を確定' }))

    const count = exerciseRepository.getAll().length
    expect(count).toBe(3)
  })

  it('edits an exercise via edit button', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)

    await user.click(screen.getByRole('button', { name: 'ベンチプレスを編集' }))
    const editInput = screen.getByLabelText('種目名を編集')
    await user.clear(editInput)
    await user.type(editInput, 'インクラインベンチ')
    await user.click(screen.getByRole('button', { name: '編集を確定' }))

    expect(screen.getByText('インクラインベンチ')).toBeInTheDocument()
    expect(screen.queryByText('ベンチプレス')).not.toBeInTheDocument()
  })

  it('deletes an exercise via delete button', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)

    await user.click(screen.getByRole('button', { name: 'デッドリフトを削除' }))

    expect(screen.queryByText('デッドリフト')).not.toBeInTheDocument()
    expect(exerciseRepository.getAll().some((e) => e.name === 'デッドリフト')).toBe(false)
  })
})
