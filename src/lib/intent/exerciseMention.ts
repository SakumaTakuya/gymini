// テキスト中で言及された種目名を探す。
// 正式名がそのまま含まれる場合を優先し、なければ正式名の前方一致
// （略称: 「ベンチ」→「ベンチプレス」）を最長一致で探す。
export function findMentionedExerciseName(
  text: string,
  exerciseNames: string[],
): string | null {
  const sorted = [...exerciseNames].sort((a, b) => b.length - a.length)
  const exact = sorted.find((name) => text.includes(name))
  if (exact) return exact

  let best: { name: string; prefixLength: number } | null = null
  for (const name of sorted) {
    for (let len = name.length - 1; len >= 2; len--) {
      if (text.includes(name.slice(0, len))) {
        if (!best || len > best.prefixLength) {
          best = { name, prefixLength: len }
        }
        break
      }
    }
  }
  return best?.name ?? null
}
