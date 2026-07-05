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

  it('種目マスターセクションラベルを表示する', () => {
    render(<ExerciseMasterSection />)
    expect(screen.getByText('種目マスター')).toBeInTheDocument()
  })

  it('初期表示で全種目を一覧表示する', () => {
    render(<ExerciseMasterSection />)
    expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
    expect(screen.getByText('スクワット')).toBeInTheDocument()
    expect(screen.getByText('デッドリフト')).toBeInTheDocument()
  })

  it('一覧の各行は共通の出現アニメ(animate-appear)でラップされる', () => {
    const { container } = render(<ExerciseMasterSection />)
    const appeared = container.querySelectorAll('.animate-appear')
    expect(appeared.length).toBe(3)
  })

  it('入力に応じてリアルタイムで種目を絞り込む', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)
    const search = screen.getByPlaceholderText('種目を検索...')

    await user.type(search, 'ベンチ')

    expect(screen.getByText('ベンチプレス')).toBeInTheDocument()
    expect(screen.queryByText('スクワット')).not.toBeInTheDocument()
    expect(screen.queryByText('デッドリフト')).not.toBeInTheDocument()
  })

  it('追加ボタンで新しい種目を追加する', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)

    await user.click(screen.getByRole('button', { name: '種目を追加' }))
    const newInput = screen.getByLabelText('新しい種目名')
    await user.type(newInput, 'チンニング')
    await user.click(screen.getByRole('button', { name: '追加を確定' }))

    expect(screen.getByText('チンニング')).toBeInTheDocument()
    expect(exerciseRepository.getAll().some((e) => e.name === 'チンニング')).toBe(true)
  })

  it('種目名が空の場合は追加しない', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)

    await user.click(screen.getByRole('button', { name: '種目を追加' }))
    await user.click(screen.getByRole('button', { name: '追加を確定' }))

    const count = exerciseRepository.getAll().length
    expect(count).toBe(3)
  })

  it('編集ボタンで種目を編集する', async () => {
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

  it('編集モード内の削除ボタンで種目を削除する', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)

    // 削除は編集モードに入ってから行う（design-system 準拠）
    await user.click(screen.getByRole('button', { name: 'デッドリフトを編集' }))
    await user.click(screen.getByRole('button', { name: 'デッドリフトを削除' }))

    expect(screen.queryByText('デッドリフト')).not.toBeInTheDocument()
    expect(exerciseRepository.getAll().some((e) => e.name === 'デッドリフト')).toBe(false)
  })

  it('重複する種目名を追加しようとするとインラインエラーを表示する', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)

    await user.click(screen.getByRole('button', { name: '種目を追加' }))
    const newInput = screen.getByLabelText('新しい種目名')
    await user.type(newInput, 'ベンチプレス')
    await user.click(screen.getByRole('button', { name: '追加を確定' }))

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('この種目名は既に登録されています')
    expect(alert).toHaveAttribute('aria-live', 'polite')
    // 追加フォームが開いたまま（破棄しない）
    expect(screen.getByLabelText('新しい種目名')).toBeInTheDocument()
    // 重複なので登録はされていない
    expect(exerciseRepository.getAll().filter((e) => e.name === 'ベンチプレス')).toHaveLength(1)
  })

  it('入力を変更すると重複エラーをクリアする', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)

    await user.click(screen.getByRole('button', { name: '種目を追加' }))
    const newInput = screen.getByLabelText('新しい種目名')
    await user.type(newInput, 'ベンチプレス')
    await user.click(screen.getByRole('button', { name: '追加を確定' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // 入力を変えるとエラーが消える
    await user.type(screen.getByLabelText('新しい種目名'), '2')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('追加をキャンセルすると重複エラーをクリアする', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)

    await user.click(screen.getByRole('button', { name: '種目を追加' }))
    await user.type(screen.getByLabelText('新しい種目名'), 'ベンチプレス')
    await user.click(screen.getByRole('button', { name: '追加を確定' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '追加をキャンセル' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('既存の名前に変更しようとするとインラインエラーを表示する', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)

    await user.click(screen.getByRole('button', { name: 'ベンチプレスを編集' }))
    const editInput = screen.getByLabelText('種目名を編集')
    await user.clear(editInput)
    await user.type(editInput, 'スクワット')
    await user.click(screen.getByRole('button', { name: '編集を確定' }))

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('この種目名は既に登録されています')
    expect(alert).toHaveAttribute('aria-live', 'polite')
    // 編集モードが維持される
    expect(screen.getByLabelText('種目名を編集')).toBeInTheDocument()
  })

  it('編集をキャンセルすると編集モードの重複エラーをクリアする', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)

    await user.click(screen.getByRole('button', { name: 'ベンチプレスを編集' }))
    const editInput = screen.getByLabelText('種目名を編集')
    await user.clear(editInput)
    await user.type(editInput, 'スクワット')
    await user.click(screen.getByRole('button', { name: '編集を確定' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '編集をキャンセル' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('検索 input に enterKeyHint="search" を設定する', () => {
    render(<ExerciseMasterSection />)
    expect(screen.getByPlaceholderText('種目を検索...')).toHaveAttribute(
      'enterkeyhint',
      'search',
    )
  })

  it('種目追加 input に enterKeyHint="done" を設定する', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)
    await user.click(screen.getByRole('button', { name: '種目を追加' }))
    expect(screen.getByLabelText('新しい種目名')).toHaveAttribute(
      'enterkeyhint',
      'done',
    )
  })

  it('種目編集 input に enterKeyHint="done" を設定する', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)
    await user.click(screen.getByRole('button', { name: 'ベンチプレスを編集' }))
    expect(screen.getByLabelText('種目名を編集')).toHaveAttribute(
      'enterkeyhint',
      'done',
    )
  })

  it('追加時に選択した部位が保存される', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)

    await user.click(screen.getByRole('button', { name: '種目を追加' }))
    await user.type(screen.getByLabelText('新しい種目名'), 'チンニング')
    await user.click(screen.getByRole('radio', { name: '背中' }))
    await user.click(screen.getByRole('button', { name: '追加を確定' }))

    const created = exerciseRepository.getAll().find((e) => e.name === 'チンニング')
    expect(created?.category).toBe('back')
  })

  it('編集で部位を変更できる', async () => {
    const user = userEvent.setup()
    render(<ExerciseMasterSection />)

    await user.click(screen.getByRole('button', { name: 'ベンチプレスを編集' }))
    await user.click(screen.getByRole('radio', { name: '胸' }))
    await user.click(screen.getByRole('button', { name: '編集を確定' }))

    const edited = exerciseRepository.getAll().find((e) => e.name === 'ベンチプレス')
    expect(edited?.category).toBe('chest')
  })
})
