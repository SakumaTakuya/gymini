import { useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { SignIn } from '@phosphor-icons/react'
import { ChatBubble } from '../components/chat/ChatBubble'
import { ChatInput } from '../components/chat/ChatInput'
import { ConfirmationBubble } from '../components/chat/ConfirmationBubble'
import { GearIcon } from '../components/GearIcon'
import { AppHeaderContent } from '../components/AppHeaderContext'
import { useChatService } from '../hooks/useChatService'
import { useSettingsStore } from '../stores/settingsStore'

export function AIChatPage() {
  const hasApiKey = useSettingsStore((s) => s.hasApiKey)
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    stopResponse,
    approve,
    reject,
  } = useChatService()
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (messages.length === 0 && !isLoading) return
    const el = bottomRef.current
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages.length, isLoading])

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      <AppHeaderContent trailing={<GearIcon />} />

      <main className="flex-1 pb-40 pt-2">
        {messages.length === 0 && !error && (
          <div className="px-6 py-12 text-center text-sm text-zinc-500">
            <p className="mb-2 font-semibold text-black">
              AI コーチとチャットを始めましょう
            </p>
            <p>
              「最近のトレーニングは？」「今日ベンチプレス60kg10回3セット」
              のように話しかけてください。
            </p>
          </div>
        )}

        {!hasApiKey && (
          <div className="mx-4 my-4 rounded-2xl bg-white border border-zinc-200 shadow-soft p-4 text-sm">
            <p className="font-semibold mb-2">APIキーが必要です</p>
            <p className="text-zinc-600 mb-3">
              Gemini APIキーを設定するとチャットが利用できます。
            </p>
            <Link
              to="/settings"
              className="focus-ring inline-flex items-center gap-1.5 h-11 px-4 rounded-xl bg-black text-white font-semibold"
            >
              <SignIn size={16} weight="bold" />
              設定画面へ
            </Link>
          </div>
        )}

        {messages.map((m) =>
          m.pendingAction ? (
            <ConfirmationBubble
              key={m.id}
              content={m.content}
              pendingAction={m.pendingAction}
              onApprove={() => approve(m.id)}
              onReject={() => reject(m.id)}
            />
          ) : (
            <ChatBubble key={m.id} role={m.role} content={m.content} />
          ),
        )}

        {isLoading && (
          <div className="flex justify-start px-4 py-2">
            <div className="max-w-[60%] rounded-[18px] rounded-bl-[4px] bg-white border border-zinc-100 shadow-soft px-4 py-2 text-sm text-zinc-500">
              <span className="inline-block animate-pulse">考え中…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-4 my-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <ChatInput
        isLoading={isLoading}
        onSend={(text) => void sendMessage(text)}
        onStop={stopResponse}
        disabled={!hasApiKey}
        placeholder={
          hasApiKey ? 'メッセージを入力' : 'APIキーを設定してください'
        }
      />
    </div>
  )
}
