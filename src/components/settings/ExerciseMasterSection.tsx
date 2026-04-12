import { useState, type ChangeEvent } from 'react'
import { MagnifyingGlass, Plus, Check, X, Trash } from '@phosphor-icons/react'
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
    <SectionCard label="種目マスター">
      {/* 上段: 検索（border-b 区切り） */}
      <div className="px-4 pt-4 pb-3 border-b border-gym-zinc-100">
        <div className="flex items-center gap-2 bg-gym-zinc-100 rounded-xl px-4 h-10">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="text-gym-zinc-400 flex-shrink-0"
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="種目を検索..."
            aria-label="種目を検索"
            className="flex-1 bg-transparent text-sm outline-none text-gym-black placeholder-gym-zinc-400"
          />
        </div>
      </div>

      {/* 中段: 種目一覧（divide-y で区切り） */}
      <div className="divide-y divide-gym-zinc-100">
        {exercises.map((ex) =>
          editingId === ex.id ? (
            <div
              key={ex.id}
              className="flex items-center gap-1 px-3 py-2"
            >
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                aria-label="種目名を編集"
                className="flex-1 bg-gym-zinc-100 rounded-xl px-3 h-10 text-sm font-inter text-gym-black"
                autoFocus
              />
              <button
                type="button"
                onClick={() => handleDelete(ex)}
                aria-label={`${ex.name}を削除`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gym-accent"
              >
                <Trash size={18} weight="bold" />
              </button>
              <button
                type="button"
                onClick={confirmEdit}
                aria-label="編集を確定"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-green-600"
              >
                <Check size={18} weight="bold" />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                aria-label="編集をキャンセル"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gym-zinc-500"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          ) : (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              onEdit={startEdit}
            />
          ),
        )}
      </div>

      {/* 下段: 追加ボタン / 追加フォーム（border-t 区切り） */}
      <div className="border-t border-gym-zinc-100">
        {adding ? (
          <div className="flex items-center gap-2 px-5 py-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              aria-label="新しい種目名"
              placeholder="種目名"
              className="flex-1 bg-gym-zinc-100 rounded-xl px-3 h-10 text-sm font-inter text-gym-black"
              autoFocus
            />
            <button
              type="button"
              onClick={confirmAdd}
              aria-label="追加を確定"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-green-600"
            >
              <Check size={18} weight="bold" />
            </button>
            <button
              type="button"
              onClick={cancelAdd}
              aria-label="追加をキャンセル"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gym-zinc-500"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startAdd}
            aria-label="種目を追加"
            className="w-full flex items-center gap-3 px-5 py-4 text-gym-black"
          >
            <span
              aria-hidden
              className="w-8 h-8 rounded-full bg-gym-black flex items-center justify-center flex-shrink-0"
            >
              <Plus size={16} weight="bold" className="text-white" />
            </span>
            <span className="font-outfit font-semibold text-sm">種目を追加</span>
          </button>
        )}
      </div>
    </SectionCard>
  )
}
