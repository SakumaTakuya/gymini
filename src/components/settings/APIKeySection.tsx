import { useEffect, useState, type ChangeEvent } from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAutoSaveField } from '@/hooks/useAutoSaveField'
import { Input } from '@/components/ui/input'
import { SectionCard } from './SectionCard'

export function APIKeySection() {
  const apiKey = useSettingsStore((s) => s.apiKey)
  const hasApiKey = useSettingsStore((s) => s.hasApiKey)
  const setApiKey = useSettingsStore((s) => s.setApiKey)
  const deleteApiKey = useSettingsStore((s) => s.deleteApiKey)
  const [visible, setVisible] = useState(false)
  const [localValue, setLocalValue] = useState(apiKey)
  const { saveStatus, scheduleSave, cancel } = useAutoSaveField()

  // 外部（他コンポーネントや loadApiKey）からの変更を入力欄に反映
  useEffect(() => {
    setLocalValue(apiKey)
  }, [apiKey])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalValue(value)
    scheduleSave(() => setApiKey(value))
  }

  const handleDelete = () => {
    cancel()
    setLocalValue('')
    deleteApiKey()
  }

  return (
    <SectionCard label="Gemini API">
      {/* 上段: 小見出し + 入力行 */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gym-zinc-500">APIキー</p>
          <span
            className="text-[10px] font-medium text-gym-zinc-400 min-h-[1em]"
            aria-live="polite"
          >
            {saveStatus === 'saving' && '保存中…'}
            {saveStatus === 'saved' && '保存済み'}
          </span>
        </div>
        <Input
          id="api-key-input"
          aria-label="Gemini APIキー"
          type={visible ? 'text' : 'password'}
          value={localValue}
          onChange={handleChange}
          placeholder="APIキーを入力"
          enterKeyHint="done"
          className="font-mono tracking-wider"
          suffix={
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'APIキーを非表示' : 'APIキーを表示'}
              className="focus-ring relative flex items-center justify-center text-gym-zinc-400 rounded-md before:absolute before:inset-[-10px] before:content-['']"
            >
              {visible ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
            </button>
          }
        />
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
            onClick={handleDelete}
            aria-label="APIキーを削除"
            className="focus-ring relative text-xs font-bold text-gym-accent px-3 py-1.5 bg-red-50 rounded-lg before:absolute before:inset-[-10px] before:content-['']"
          >
            削除
          </button>
        )}
      </div>
    </SectionCard>
  )
}
