const KATAKANA_CHAR = /[ァ-ヶー]/

/**
 * needle が text 中に「独立した語」として現れる位置を返す（なければ -1）。
 * 一致の前後どちらかの文字がカタカナの場合は、別のカタカナ語の一部
 * （例: 「プランク」の中の「ラン」）とみなして一致としない。
 */
export function indexOfStandaloneMention(
  text: string,
  needle: string,
): number {
  let idx = text.indexOf(needle)
  while (idx !== -1) {
    const before = idx > 0 ? text[idx - 1] : ''
    const after =
      idx + needle.length < text.length ? text[idx + needle.length] : ''
    if (!KATAKANA_CHAR.test(before) && !KATAKANA_CHAR.test(after)) {
      return idx
    }
    idx = text.indexOf(needle, idx + 1)
  }
  return -1
}

// テキスト中で言及された種目名を探す。
// 正式名がそのまま含まれる場合を優先し、なければ正式名の前方一致
// （略称: 「ベンチ」→「ベンチプレス」）を最長一致で探す。
// どちらの一致も、別のカタカナ語に埋め込まれたものは拾わない。
export function findMentionedExerciseName(
  text: string,
  exerciseNames: string[],
): string | null {
  const sorted = [...exerciseNames].sort((a, b) => b.length - a.length)
  const exact = sorted.find(
    (name) => indexOfStandaloneMention(text, name) !== -1,
  )
  if (exact) return exact

  let best: { name: string; prefixLength: number } | null = null
  for (const name of sorted) {
    for (let len = name.length - 1; len >= 2; len--) {
      if (indexOfStandaloneMention(text, name.slice(0, len)) !== -1) {
        if (!best || len > best.prefixLength) {
          best = { name, prefixLength: len }
        }
        break
      }
    }
  }
  return best?.name ?? null
}
