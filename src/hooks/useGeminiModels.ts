import { useQuery } from '@tanstack/react-query'
import { useSettingsStore } from '@/stores/settingsStore'
import { queryKeys } from '@/lib/queryKeys'
import { fetchAvailableModels } from '@/lib/geminiModels'

/**
 * 利用可能な Gemini モデル一覧を取得する hook（FR_011）。
 *
 * APIキーが設定されている間のみ ListModels を叩く。APIキーごとに
 * キャッシュし、モデルは頻繁には変わらないため staleTime を長めに取る。
 */
export function useGeminiModels() {
  const apiKey = useSettingsStore((s) => s.apiKey)
  const hasApiKey = useSettingsStore((s) => s.hasApiKey)

  return useQuery({
    queryKey: queryKeys.geminiModels(apiKey),
    queryFn: ({ signal }) => fetchAvailableModels(apiKey, signal),
    enabled: hasApiKey,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
