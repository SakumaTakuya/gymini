import { useState, type ChangeEvent } from 'react'
import { Eye, EyeSlash, Trash } from '@phosphor-icons/react'
import { useSettingsStore } from '@/stores/settingsStore'
import { SectionCard } from './SectionCard'

export function APIKeySection() {
  const apiKey = useSettingsStore((s) => s.apiKey)
  const hasApiKey = useSettingsStore((s) => s.hasApiKey)
  const setApiKey = useSettingsStore((s) => s.setApiKey)
  const deleteApiKey = useSettingsStore((s) => s.deleteApiKey)
  const [visible, setVisible] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value)
  }

  return (
    <SectionCard label="Gemini API">
      {/* 上段: 小見出し + 入力行 */}
      <div className="px-5 py-4">
        <p className="text-xs font-medium text-gym-zinc-500 mb-2">APIキー</p>
        <div className="flex items-center gap-2 bg-gym-zinc-100 rounded-xl px-4 h-11 border border-gym-zinc-200">
          <input
            id="api-key-input"
            aria-label="Gemini APIキー"
            type={visible ? 'text' : 'password'}
            value={apiKey}
            onChange={handleChange}
            className="flex-1 bg-transparent text-sm font-medium outline-none text-gym-black font-mono tracking-wider"
            placeholder="APIキーを入力"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'APIキーを非表示' : 'APIキーを表示'}
            className="relative flex items-center justify-center text-gym-zinc-400 before:absolute before:inset-[-10px] before:content-['']"
          >
            {visible ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
          </button>
        </div>
      </div>

      {/* 下段: ステータス + 削除（border-t で区切り） */}
      <div className="border-t border-gym-zinc-100 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasApiKey ? (
            <>
              <span
                aria-hidden
                className="inline-block w-2 h-2 rounded-full bg-green-500"
              />
              <span className="text-xs font-medium text-gym-zinc-500">
                接続済み
              </span>
            </>
          ) : (
            <span className="text-xs font-medium text-gym-zinc-400">未設定</span>
          )}
        </div>

        {hasApiKey && (
          <button
            type="button"
            onClick={deleteApiKey}
            aria-label="APIキーを削除"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gym-accent"
          >
            <Trash size={20} weight="bold" />
          </button>
        )}
      </div>
    </SectionCard>
  )
}
