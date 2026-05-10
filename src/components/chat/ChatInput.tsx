import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import { PaperPlaneRight, Stop } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { IconButton } from '../ui/icon-button'
import type { Exercise } from '@/types'

export type ChatInputProps = {
  isLoading: boolean
  onSend: (text: string) => void
  onStop: () => void
  placeholder?: string
  disabled?: boolean
  searchExercises?: (query: string) => Exercise[]
  onSelectExercise?: (exercise: {
    exerciseId: string
    exerciseName: string
  }) => void
  createExercise?: (name: string) => Exercise
}

export function ChatInput({
  isLoading,
  onSend,
  onStop,
  placeholder = 'メッセージを入力',
  disabled = false,
  searchExercises,
  onSelectExercise,
  createExercise,
}: ChatInputProps) {
  const [text, setText] = useState('')
  const [popoverOpen, setPopoverOpen] = useState(false)

  const trimmed = text.trim()
  const popoverEnabled = !!(searchExercises && onSelectExercise)
  const candidates = useMemo<Exercise[]>(
    () =>
      popoverEnabled && trimmed !== '' ? searchExercises!(trimmed) : [],
    [popoverEnabled, searchExercises, trimmed],
  )
  const exactMatch = candidates.some((e) => e.name === trimmed)
  const showCreateChip =
    popoverEnabled && trimmed !== '' && !exactMatch && !!createExercise
  const showPopover =
    popoverOpen &&
    popoverEnabled &&
    trimmed !== '' &&
    (candidates.length > 0 || showCreateChip)

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (isLoading || disabled || trimmed === '') return
    onSend(trimmed)
    setText('')
    setPopoverOpen(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  const handleSelect = (exercise: Exercise) => {
    onSelectExercise?.({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
    })
    setText('')
    setPopoverOpen(false)
  }

  const handleCreate = () => {
    if (!createExercise || !onSelectExercise) return
    try {
      const created = createExercise(trimmed)
      onSelectExercise({
        exerciseId: created.id,
        exerciseName: created.name,
      })
    } catch {
      // 既存名（DUPLICATE）等は無視。実用上 UI 側で「新規追加」チップが
      // 出ているのは候補に exact match が無いときのみ。
    }
    setText('')
    setPopoverOpen(false)
  }

  return (
    <form
      onSubmit={submit}
      className="fixed left-0 right-0 z-30 px-3 pb-3"
      style={{ bottom: 96 }}
    >
      <div className="mx-auto max-w-xl relative">
        {showPopover && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-gym-white rounded-xl shadow-float border border-gym-zinc-200 z-50 max-h-48 overflow-y-auto">
            {candidates.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(exercise)}
                className="focus-ring w-full text-left px-4 py-3 text-sm font-medium text-gym-black hover:bg-gym-zinc-50 first:rounded-t-xl last:rounded-b-xl"
              >
                {exercise.name}
              </button>
            ))}
            {showCreateChip && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCreate}
                className="focus-ring w-full text-left px-4 py-3 text-sm font-medium text-gym-zinc-500 hover:bg-gym-zinc-50 border-t border-gym-zinc-100 last:rounded-b-xl"
              >
                「{trimmed}」を新規追加
              </button>
            )}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-3xl bg-gym-white border border-gym-zinc-200 shadow-soft px-3 py-2 focus-within:border-gym-black">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setPopoverOpen(true)
            }}
            onFocus={() => {
              if (text.trim() !== '') setPopoverOpen(true)
            }}
            onBlur={() => {
              setTimeout(() => setPopoverOpen(false), 200)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent outline-none',
              'text-base text-gym-black placeholder:text-gym-zinc-400',
              'min-h-[36px] max-h-32 py-1.5 px-1',
            )}
          />
          {isLoading ? (
            <IconButton
              onClick={onStop}
              aria-label="応答を停止"
              className="size-10 rounded-full bg-gym-zinc-200 text-gym-black"
            >
              <Stop size={18} weight="fill" />
            </IconButton>
          ) : (
            <IconButton
              type="submit"
              aria-label="送信"
              disabled={disabled || trimmed === ''}
              className={cn(
                'size-10 rounded-full',
                'bg-gym-black text-gym-white hover:bg-gym-black/90',
                'disabled:opacity-40',
              )}
            >
              <PaperPlaneRight size={18} weight="bold" />
            </IconButton>
          )}
        </div>
      </div>
    </form>
  )
}
