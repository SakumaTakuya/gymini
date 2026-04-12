import { useState, type ChangeEvent } from 'react'
import { Eye, EyeSlash, Trash } from '@phosphor-icons/react'
import { useSettingsStore } from '../../stores/settingsStore'
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
    <SectionCard>
      <h2 className="text-sm font-outfit font-bold text-zinc-500 mb-3">
        Gemini API
      </h2>

      <div className="relative">
        <input
          id="api-key-input"
          aria-label="Gemini APIキー"
          type={visible ? 'text' : 'password'}
          value={apiKey}
          onChange={handleChange}
          className="w-full bg-zinc-100 rounded-xl px-4 pr-12 h-12 text-sm font-inter"
          placeholder="APIキーを入力"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'APIキーを非表示' : 'APIキーを表示'}
          className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-500"
        >
          {visible ? <EyeSlash size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {hasApiKey ? (
          <span className="text-sm text-emerald-600 flex items-center gap-1">
            <span
              aria-hidden
              className="inline-block w-2 h-2 rounded-full bg-emerald-500"
            />
            接続済み
          </span>
        ) : (
          <span className="text-sm text-zinc-400">未設定</span>
        )}

        {hasApiKey && (
          <button
            type="button"
            onClick={deleteApiKey}
            aria-label="APIキーを削除"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500"
          >
            <Trash size={20} />
          </button>
        )}
      </div>
    </SectionCard>
  )
}
