import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { PaperPlaneRight, Stop } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'

export type ChatInputProps = {
  isLoading: boolean
  onSend: (text: string) => void
  onStop: () => void
  placeholder?: string
  disabled?: boolean
}

export function ChatInput({
  isLoading,
  onSend,
  onStop,
  placeholder = 'メッセージを入力',
  disabled = false,
}: ChatInputProps) {
  const [text, setText] = useState('')

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    const trimmed = text.trim()
    if (isLoading || disabled || trimmed === '') return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={submit}
      className="fixed left-0 right-0 z-30 px-3 pb-3"
      style={{ bottom: 96 }}
    >
      <div className="mx-auto max-w-xl flex items-end gap-2 rounded-3xl bg-gym-white border border-gym-zinc-200 shadow-soft px-3 py-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'focus-ring flex-1 resize-none bg-transparent outline-none',
            'text-base text-gym-black placeholder:text-gym-zinc-400',
            'min-h-[36px] max-h-32 py-1.5 px-1',
          )}
        />
        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="応答を停止"
            className="focus-ring flex items-center justify-center size-10 rounded-full bg-gym-zinc-200 text-gym-black"
          >
            <Stop size={18} weight="fill" />
          </button>
        ) : (
          <button
            type="submit"
            aria-label="送信"
            disabled={disabled || text.trim() === ''}
            className={cn(
              'focus-ring flex items-center justify-center size-10 rounded-full',
              'bg-gym-black text-gym-white',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            <PaperPlaneRight size={18} weight="bold" />
          </button>
        )}
      </div>
    </form>
  )
}
