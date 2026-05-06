import type { Content } from '@google/generative-ai'
import type { ChatMessage } from '../../types/chat'

export const EMPTY_RESPONSE_FALLBACK =
  'ナイス！💪 種目名や重量・回数が決まったら教えてくれれば記録できますよ（例:「ダンベルプレスやる」「ベンチプレス60kg10回」）'

export function messagesToContents(messages: ChatMessage[]): Content[] {
  // Gemini API は role が user/model で交互に並んでいることを要求する。
  // approve 後の結果メッセージなど assistant が連続した場合は本文を改行で連結し、
  // 先頭が model の場合は破棄する（user 起点でないと 400 になる）。
  const contents: Content[] = []
  for (const m of messages) {
    const text = m.content.trim()
    if (text === '') continue
    const role: 'user' | 'model' = m.role === 'user' ? 'user' : 'model'
    const last = contents[contents.length - 1]
    if (last && last.role === role) {
      const lastPart = last.parts[last.parts.length - 1]
      const prevText =
        lastPart && 'text' in lastPart && typeof lastPart.text === 'string'
          ? lastPart.text
          : ''
      last.parts = [{ text: prevText ? `${prevText}\n\n${text}` : text }]
      continue
    }
    contents.push({ role, parts: [{ text }] })
  }
  while (contents.length > 0 && contents[0].role === 'model') {
    contents.shift()
  }
  return contents
}

export function nonEmptyOr(
  text: string | null | undefined,
  fallback: string,
): string {
  if (typeof text !== 'string') return fallback
  return text.trim() === '' ? fallback : text
}

export function toFunctionResponseObject(value: unknown): object {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as object
  }
  return { value }
}

export function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true
  if (err instanceof Error) {
    if (err.name === 'AbortError') return true
    if (err.name === 'GoogleGenerativeAIAbortError') return true
    if (err.message.includes('aborted') || err.message.includes('Aborted'))
      return true
  }
  return false
}
