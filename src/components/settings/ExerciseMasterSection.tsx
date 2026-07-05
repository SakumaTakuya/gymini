import { useState, type ChangeEvent } from 'react'
import { MagnifyingGlass, Plus, Check, X, Trash } from '@phosphor-icons/react'
import { useExercises } from '@/hooks/useExercises'
import { useInlineEditField } from '@/hooks/useInlineEditField'
import type { Exercise, ExerciseCategory } from '@/schemas/exercise'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { Appear } from '@/components/motion/Appear'
import { ExerciseRow } from './ExerciseRow'
import { SectionCard } from './SectionCard'
import { CategoryChips } from './CategoryChips'

const DUPLICATE_ERROR_MESSAGE = 'この種目名は既に登録されています'

function mapDuplicateError(err: unknown): string | null {
  return err instanceof Error && err.message.startsWith('Duplicate name:')
    ? DUPLICATE_ERROR_MESSAGE
    : null
}

export function ExerciseMasterSection() {
  const { search, create, update, remove } = useExercises()
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addCategory, setAddCategory] = useState<ExerciseCategory>('unassigned')
  const [editCategory, setEditCategory] = useState<ExerciseCategory>('unassigned')
  const addField = useInlineEditField(mapDuplicateError)
  const editField = useInlineEditField(mapDuplicateError)

  const visibleExercises = search(query)

  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const startAdd = () => {
    setAdding(true)
    setAddCategory('unassigned')
    addField.reset()
  }

  const cancelAdd = () => {
    setAdding(false)
    addField.reset()
  }

  const confirmAdd = () => {
    if (addField.commit((name) => create(name, addCategory))) {
      cancelAdd()
    }
  }

  const handleNewNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    addField.setValue(e.target.value)
  }

  const startEdit = (exercise: Exercise) => {
    setEditingId(exercise.id)
    setEditCategory(exercise.category)
    editField.reset(exercise.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    editField.reset()
  }

  const confirmEdit = () => {
    if (editingId === null) return
    const id = editingId
    if (editField.commit((name) => update(id, name, editCategory))) {
      cancelEdit()
    }
  }

  const handleEditNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    editField.setValue(e.target.value)
  }

  const handleDelete = (exercise: Exercise) => {
    remove(exercise.id)
  }

  return (
    <SectionCard label="種目マスター">
      {/* 上段: 検索（border-b 区切り） */}
      <div className="px-4 pt-4 pb-3 border-b border-gym-zinc-100">
        <Input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="種目を検索..."
          aria-label="種目を検索"
          enterKeyHint="search"
          prefix={<MagnifyingGlass size={16} weight="bold" className="text-gym-zinc-400 flex-shrink-0" aria-hidden />}
          variant="filled"
        />
      </div>

      {/* 中段: 種目一覧（divide-y で区切り） */}
      <div className="divide-y divide-gym-zinc-100">
        {visibleExercises.map((ex, exIndex) =>
          editingId === ex.id ? (
            <div key={ex.id} className="px-3 py-2">
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  value={editField.value}
                  onChange={handleEditNameChange}
                  aria-label="種目名を編集"
                  aria-invalid={editField.error !== null || undefined}
                  aria-describedby={editField.error !== null ? 'edit-error' : undefined}
                  enterKeyHint="done"
                  autoFocus
                />
                <IconButton
                  onClick={() => handleDelete(ex)}
                  aria-label={`${ex.name}を削除`}
                  className="rounded text-gym-accent"
                >
                  <Trash size={18} weight="bold" />
                </IconButton>
                <IconButton
                  onClick={confirmEdit}
                  aria-label="編集を確定"
                  className="rounded text-green-600"
                >
                  <Check size={18} weight="bold" />
                </IconButton>
                <IconButton
                  onClick={cancelEdit}
                  aria-label="編集をキャンセル"
                  className="rounded text-gym-zinc-500"
                >
                  <X size={18} weight="bold" />
                </IconButton>
              </div>
              {editField.error !== null && (
                <p
                  id="edit-error"
                  role="alert"
                  aria-live="polite"
                  className="mt-1 text-xs font-medium text-gym-accent"
                >
                  {editField.error}
                </p>
              )}
              <div className="mt-2">
                <CategoryChips value={editCategory} onChange={setEditCategory} />
              </div>
            </div>
          ) : (
            <Appear key={ex.id} index={exIndex}>
              <ExerciseRow exercise={ex} onEdit={startEdit} />
            </Appear>
          ),
        )}
      </div>

      {/* 下段: 追加ボタン / 追加フォーム（border-t 区切り） */}
      <div className="border-t border-gym-zinc-100">
        {adding ? (
          <div className="px-5 py-2">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={addField.value}
                onChange={handleNewNameChange}
                aria-label="新しい種目名"
                aria-invalid={addField.error !== null || undefined}
                aria-describedby={addField.error !== null ? 'add-error' : undefined}
                placeholder="種目名"
                enterKeyHint="done"
                autoFocus
              />
              <IconButton
                onClick={confirmAdd}
                aria-label="追加を確定"
                className="rounded text-green-600"
              >
                <Check size={18} weight="bold" />
              </IconButton>
              <IconButton
                onClick={cancelAdd}
                aria-label="追加をキャンセル"
                className="rounded text-gym-zinc-500"
              >
                <X size={18} weight="bold" />
              </IconButton>
            </div>
            {addField.error !== null && (
              <p
                id="add-error"
                role="alert"
                aria-live="polite"
                className="mt-1 text-xs font-medium text-gym-accent"
              >
                {addField.error}
              </p>
            )}
            <div className="mt-2">
              <CategoryChips value={addCategory} onChange={setAddCategory} />
            </div>
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
