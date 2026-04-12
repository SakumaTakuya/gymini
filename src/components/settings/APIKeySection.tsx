import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { useSettingsStore } from '@/stores/settingsStore'
import { SectionCard } from './SectionCard'

const DEBOUNCE_MS = 300
const SAVED_HOLD_MS = 1500

type SaveStatus = 'idle' | 'saving' | 'saved'

export function APIKeySection() {
  const apiKey = useSettingsStore((s) => s.apiKey)
  const hasApiKey = useSettingsStore((s) => s.hasApiKey)
  const setApiKey = useSettingsStore((s) => s.setApiKey)
  const deleteApiKey = useSettingsStore((s) => s.deleteApiKey)
  const [visible, setVisible] = useState(false)
  const [localValue, setLocalValue] = useState(apiKey)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 外部（他コンポーネントや loadApiKey）からの変更を入力欄に反映
  useEffect(() => {
    setLocalValue(apiKey)
  }, [apiKey])

  // unmount 時に pending な timer を必ずクリア（副作用漏れ防止）
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
      }
      if (savedTimerRef.current !== null) {
        clearTimeout(savedTimerRef.current)
      }
    }
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalValue(value)
    setSaveStatus('saving')

    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current)
    }
    if (savedTimerRef.current !== null) {
      clearTimeout(savedTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      setApiKey(value)
      setSaveStatus('saved')
      savedTimerRef.current = setTimeout(() => {
        savedTimerRef.current = null
        setSaveStatus('idle')
      }, SAVED_HOLD_MS)
    }, DEBOUNCE_MS)
  }

  const handleDelete = () => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (savedTimerRef.current !== null) {
      clearTimeout(savedTimerRef.current)
      savedTimerRef.current = null
    }
    setLocalValue('')
    setSaveStatus('idle')
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
        <div className="flex items-center gap-2 bg-gym-zinc-100 rounded-xl px-4 h-11 border border-gym-zinc-200">
          <input
            id="api-key-input"
            aria-label="Gemini APIキー"
            type={visible ? 'text' : 'password'}
            value={localValue}
            onChange={handleChange}
            className="flex-1 bg-transparent text-sm font-medium outline-none text-gym-black font-mono tracking-wider"
            placeholder="APIキーを入力"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'APIキーを非表示' : 'APIキーを表示'}
            className="focus-ring relative flex items-center justify-center text-gym-zinc-400 rounded-md before:absolute before:inset-[-10px] before:content-['']"
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
