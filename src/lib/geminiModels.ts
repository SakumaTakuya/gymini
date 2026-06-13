// 利用可能な Gemini モデルを ListModels API から動的に取得する（FR_011）。
// モデルは頻繁に更新されるため、コード内の固定リストを持たない。

/** ListModels の既定取得先。BYOK のため APIキーを query に付けて直接叩く（B-001）。 */
const MODELS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

/** モデル未選択時・読み込み失敗時のフォールバック。 */
export const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview'

export type GeminiModelInfo = {
  /** `models/` 接頭辞を除いたモデル id（例: `gemini-3-flash-preview`）。 */
  id: string
  /** 人間向け表示名。API が返さない場合は id を流用する。 */
  displayName: string
}

type ListModelsResponse = {
  models?: Array<{
    name?: string
    displayName?: string
    supportedGenerationMethods?: string[]
  }>
}

function stripPrefix(name: string): string {
  return name.replace(/^models\//, '')
}

/**
 * Gemini ListModels を呼び出し、`generateContent` をサポートするモデルだけを返す。
 * 埋め込み専用モデル等は対話に使えないため除外する。
 */
export async function fetchAvailableModels(
  apiKey: string,
  signal?: AbortSignal,
): Promise<GeminiModelInfo[]> {
  const url = `${MODELS_ENDPOINT}?key=${encodeURIComponent(apiKey)}`
  const response = await fetch(url, signal ? { signal } : undefined)
  if (!response.ok) {
    throw new Error(`ListModels failed: HTTP ${response.status}`)
  }
  const data = (await response.json()) as ListModelsResponse
  const models = data.models ?? []
  return models
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => {
      const id = stripPrefix(m.name ?? '')
      return { id, displayName: m.displayName || id }
    })
    .filter((m) => m.id !== '')
}
