import { useState, type ChangeEvent } from 'react'
import { MagnifyingGlass, Plus, Check, X, Trash } from '@phosphor-icons/react'
import { useExercises } from '@/hooks/useExercises'
import type { Exercise } from '@/types'
import { ExerciseRow } from './ExerciseRow'
import { SectionCard } from './SectionCard'

const DUPLICATE_ERROR_MESSAGE = 'この種目名は既に登録されています'

function isDuplicateNameError(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith('Duplicate name:')
}

export function ExerciseMasterSection() {
  const { search, create, update, remove } = useExercises()
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  const visibleExercises = search(query)

  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const startAdd = () => {
    setAdding(true)
    setNewName('')
    setAddError(null)
  }

  const cancelAdd = () => {
    setAdding(false)
    setNewName('')
    setAddError(null)
  }

  const confirmAdd = () => {
    const trimmed = newName.trim()
    if (trimmed === '') {
      cancelAdd()
      return
    }
    try {
      create(trimmed)
      cancelAdd()
    } catch (err) {
      if (isDuplicateNameError(err)) {
        setAddError(DUPLICATE_ERROR_MESSAGE)
        return
      }
      cancelAdd()
    }
  }

  const handleNewNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value)
    if (addError !== null) {
      setAddError(null)
    }
  }

  const startEdit = (exercise: Exercise) => {
    setEditingId(exercise.id)
    setEditName(exercise.name)
    setEditError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditError(null)
  }

  const confirmEdit = () => {
    if (editingId === null) return
    const trimmed = editName.trim()
    if (trimmed === '') {
      cancelEdit()
      return
    }
    try {
      update(editingId, trimmed)
      cancelEdit()
    } catch (err) {
      if (isDuplicateNameError(err)) {
        setEditError(DUPLICATE_ERROR_MESSAGE)
        return
      }
      cancelEdit()
    }
  }

  const handleEditNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditName(e.target.value)
    if (editError !== null) {
      setEditError(null)
    }
  }

  const handleDelete = (exercise: Exercise) => {
    remove(exercise.id)
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
            className="flex-1 bg-transparent text-base outline-none text-gym-black placeholder-gym-zinc-400"
          />
        </div>
      </div>

      {/* 中段: 種目一覧（divide-y で区切り） */}
      <div className="divide-y divide-gym-zinc-100">
        {visibleExercises.map((ex) =>
          editingId === ex.id ? (
            <div key={ex.id} className="px-3 py-2">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editName}
                  onChange={handleEditNameChange}
                  aria-label="種目名を編集"
                  aria-invalid={editError !== null || undefined}
                  aria-describedby={editError !== null ? 'edit-error' : undefined}
                  className="flex-1 bg-gym-zinc-100 rounded-xl px-3 h-10 text-base font-inter text-gym-black"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleDelete(ex)}
                  aria-label={`${ex.name}を削除`}
                  className="focus-ring rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center text-gym-accent"
                >
                  <Trash size={18} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={confirmEdit}
                  aria-label="編集を確定"
                  className="focus-ring rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center text-green-600"
                >
                  <Check size={18} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  aria-label="編集をキャンセル"
                  className="focus-ring rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center text-gym-zinc-500"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
              {editError !== null && (
                <p
                  id="edit-error"
                  role="alert"
                  aria-live="polite"
                  className="mt-1 text-xs font-medium text-gym-accent"
                >
                  {editError}
                </p>
              )}
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
          <div className="px-5 py-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={handleNewNameChange}
                aria-label="新しい種目名"
                aria-invalid={addError !== null || undefined}
                aria-describedby={addError !== null ? 'add-error' : undefined}
                placeholder="種目名"
                className="flex-1 bg-gym-zinc-100 rounded-xl px-3 h-10 text-base font-inter text-gym-black"
                autoFocus
              />
              <button
                type="button"
                onClick={confirmAdd}
                aria-label="追加を確定"
                className="focus-ring rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center text-green-600"
              >
                <Check size={18} weight="bold" />
              </button>
              <button
                type="button"
                onClick={cancelAdd}
                aria-label="追加をキャンセル"
                className="focus-ring rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center text-gym-zinc-500"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            {addError !== null && (
              <p
                id="add-error"
                role="alert"
                aria-live="polite"
                className="mt-1 text-xs font-medium text-gym-accent"
              >
                {addError}
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={startAdd}
            aria-label="種目を追加"
            className="focus-ring w-full flex items-center gap-3 px-5 py-4 text-gym-black"
          >
            <span
              aria-hidden
              className="w-8 h-8 rounded-full bg-gym-black flex items-center justify-center flex-shrink-0"
            >
              <Plus size={16} weight="bold" className="text-gym-white" />
            </span>
            <span className="font-outfit font-semibold text-sm">種目を追加</span>
          </button>
        )}
      </div>
    </SectionCard>
  )
}
