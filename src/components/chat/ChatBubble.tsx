import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '../../lib/utils'

export type ChatBubbleProps = {
  role: 'user' | 'assistant'
  content: string
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-1">
        <div
          className={cn(
            'max-w-[75%] rounded-[18px] rounded-br-[4px]',
            'bg-gym-black text-gym-white px-4 py-2.5 text-sm whitespace-pre-wrap break-words',
          )}
        >
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start px-4 py-1">
      <div
        className={cn(
          'max-w-[88%] rounded-[18px] rounded-bl-[4px]',
          'bg-gym-white border border-gym-zinc-100 shadow-soft',
          'px-4 py-2.5 text-sm text-gym-black',
        )}
      >
        <div className="chat-markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || '...'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
