import { useState, type ChangeEvent } from 'react'
import { MagnifyingGlass, Plus, Check, X } from '@phosphor-icons/react'
import * as exerciseRepository from '@/lib/exerciseRepository'
import type { Exercise } from '@/types'
import { ExerciseRow } from './ExerciseRow'
import { SectionCard } from './SectionCard'

export function ExerciseMasterSection() {
  const [query, setQuery] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>(() =>
    exerciseRepository.getAll(),
  )
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const refresh = (nextQuery = query) => {
    setExercises(
      nextQuery.trim() === ''
        ? exerciseRepository.getAll()
        : exerciseRepository.search(nextQuery),
    )
  }

  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    refresh(value)
  }

  const startAdd = () => {
    setAdding(true)
    setNewName('')
  }

  const cancelAdd = () => {
    setAdding(false)
    setNewName('')
  }

  const confirmAdd = () => {
    const trimmed = newName.trim()
    if (trimmed === '') {
      cancelAdd()
      return
    }
    try {
      exerciseRepository.create(trimmed)
      refresh()
    } catch {
      // 重複などのエラーは UI で無視（将来的にはエラー表示を追加）
    }
    cancelAdd()
  }

  const startEdit = (exercise: Exercise) => {
    setEditingId(exercise.id)
    setEditName(exercise.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const confirmEdit = () => {
    if (editingId === null) return
    const trimmed = editName.trim()
    if (trimmed === '') {
      cancelEdit()
      return
    }
    try {
      exerciseRepository.update(editingId, trimmed)
      refresh()
    } catch {
      // 重複などのエラーは UI で無視
    }
    cancelEdit()
  }

  const handleDelete = (exercise: Exercise) => {
    exerciseRepository.remove(exercise.id)
    refresh()
  }

  return (
    <SectionCard>
      <h2 className="text-sm font-outfit font-bold text-zinc-500 mb-3">
        種目マスター
      </h2>

      <div className="relative mb-2">
        <MagnifyingGlass
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="種目を検索..."
          aria-label="種目を検索"
          className="w-full bg-zinc-100 rounded-xl pl-10 pr-4 h-12 text-sm font-inter"
        />
      </div>

      <div>
        {exercises.map((ex) =>
          editingId === ex.id ? (
            <div
              key={ex.id}
              className="flex items-center justify-between border-b border-zinc-100 py-2 gap-2"
            >
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                aria-label="種目名を編集"
                className="flex-1 bg-zinc-100 rounded-xl px-3 h-10 text-sm font-inter"
                autoFocus
              />
              <button
                type="button"
                onClick={confirmEdit}
                aria-label="編集を確定"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-emerald-600"
              >
                <Check size={18} />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                aria-label="編集をキャンセル"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-500"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          ),
        )}
      </div>

      {adding ? (
        <div className="flex items-center gap-2 py-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            aria-label="新しい種目名"
            placeholder="種目名"
            className="flex-1 bg-zinc-100 rounded-xl px-3 h-10 text-sm font-inter"
            autoFocus
          />
          <button
            type="button"
            onClick={confirmAdd}
            aria-label="追加を確定"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-emerald-600"
          >
            <Check size={18} />
          </button>
          <button
            type="button"
            onClick={cancelAdd}
            aria-label="追加をキャンセル"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-500"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startAdd}
          aria-label="種目を追加"
          className="h-12 min-h-[44px] w-full flex items-center gap-2 text-sm text-zinc-500"
        >
          <Plus size={18} />
          <span>種目を追加</span>
        </button>
      )}
    </SectionCard>
  )
}
