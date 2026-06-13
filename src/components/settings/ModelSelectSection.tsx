import { useMemo, type ChangeEvent } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useGeminiModels } from '@/hooks/useGeminiModels'
import type { GeminiModelInfo } from '@/lib/geminiModels'
import { SectionCard } from './SectionCard'

export function ModelSelectSection() {
  const hasApiKey = useSettingsStore((s) => s.hasApiKey)
  const model = useSettingsStore((s) => s.model)
  const setModel = useSettingsStore((s) => s.setModel)
  const { data, isLoading, isError } = useGeminiModels()

  // 取得一覧に現在選択中のモデルが無い場合でも option として残し、
  // 選択値が空に落ちないようにする（プレビュー版や非公開モデル対策）。
  const options = useMemo<GeminiModelInfo[]>(() => {
    const list = data ?? []
    if (model && !list.some((m) => m.id === model)) {
      return [{ id: model, displayName: model }, ...list]
    }
    return list
  }, [data, model])

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setModel(e.target.value)
  }

  return (
    <SectionCard label="Gemini モデル">
      <div className="px-5 py-4 space-y-2">
        <label
          htmlFor="gemini-model-select"
          className="block text-xs font-medium text-gym-zinc-500"
        >
          対話に使うモデル
        </label>

        {!hasApiKey ? (
          <p className="text-xs text-gym-zinc-400">
            APIキーを設定するとモデルを選択できます。
          </p>
        ) : isLoading ? (
          <p className="text-xs text-gym-zinc-400">モデル一覧を取得中…</p>
        ) : isError ? (
          <p className="text-xs text-gym-accent">
            モデル一覧を取得できませんでした。APIキーを確認してください。
          </p>
        ) : (
          <div className="flex items-center border-b border-gym-zinc-300 h-11 focus-within:border-gym-black">
            <select
              id="gemini-model-select"
              aria-label="Gemini モデル"
              value={model}
              onChange={handleChange}
              className="w-full bg-transparent text-base font-medium outline-none text-gym-black appearance-none cursor-pointer"
            >
              {options.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </SectionCard>
  )
}
