import type { WorkoutSet } from '../../schemas/workout'

// record 意図のルールベース数値抽出（docs/prd/intent-router/index.md §6 の
// 決定範囲 C のうちルールベース分）。LLM を使わず、定型パターン・×表記・
// 時間・距離・自重/回数のみ・「、」区切りの複数種目を扱う。
// 抽出できなかった項目は呼び出し側で空欄カードとして挿入される（FR_004）。

export interface ExtractedRecordExercise {
  exerciseName: string
  /** 完了セットとして挿入できるセット（reps > 0 のものだけ） */
  sets: WorkoutSet[]
  /** 回数が取れずセットを materialize できなかった場合に言及された重量 */
  mentionedWeight?: number
  /** 時間パターン（例: '60秒' / '3分'）。セット形式に保持欄がないため表示用 */
  durationText?: string
  /** 距離パターン（例: '5km'）。セット形式に保持欄がないため表示用 */
  distanceText?: string
  /** 時間・距離のみで言及されたセット数 */
  mentionedSets?: number
}

// ユーザー入力のセット数をそのまま配列長にすると、誤入力や貼り付けで
// 巨大な配列を作ってしまうため、現実的な上限で丸める。
const MAX_SETS_PER_EXERCISE = 100

function clampSetCount(count: number): number {
  if (!Number.isFinite(count) || count < 0) return 0
  return Math.min(Math.floor(count), MAX_SETS_PER_EXERCISE)
}

interface ParsedNumbers {
  weight?: number
  reps?: number
  setCount?: number
  durationText?: string
  distanceText?: string
}

// 完了を表す語尾。これらを含むセグメントは数値がなくても種目の開始とみなす。
const COMPLETION_SUFFIXES = [
  '終わった',
  'やった',
  'した',
  'できた',
  '完了',
  'こなした',
  'やれた',
  'いけた',
  '引けた',
  '上がった',
  'キープ',
  '終わり',
  'おわり',
]

const TRAILING_PARTICLES = ['は', 'を', 'が', 'も', 'の']

// 種目名ではありえない語。これらが先行する節（「次は72.5kgでやろう」等）は
// 記録ではなく計画・感想なので、種目として自動作成しない。
const NON_EXERCISE_TOKENS = new Set([
  '次',
  '次回',
  '今度',
  '明日',
  '昨日',
  'あと',
  'それ',
  'これ',
  'ここ',
])

/** マスター未登録のトークンを新規種目名として採用してよいか。 */
function isPlausibleNewExerciseName(token: string): boolean {
  if (token.length < 2) return false
  if (NON_EXERCISE_TOKENS.has(token)) return false
  return true
}

function normalizeText(text: string): string {
  return text
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xff10 + 0x30))
    .replace(/．/g, '.')
    .replace(/[✕✖ｘＸ]/g, '×')
}

/** 種目名候補トークンの後片付け（日付接頭辞・助詞・完了語尾の除去）。 */
function cleanNameToken(raw: string): string {
  let token = raw.trim()
  token = token.replace(/^(今日の|今日は|今日)/, '')
  let changed = true
  while (changed && token !== '') {
    changed = false
    for (const suffix of COMPLETION_SUFFIXES) {
      if (token.length > suffix.length && token.endsWith(suffix)) {
        token = token.slice(0, -suffix.length)
        changed = true
      }
    }
    if (
      token.length > 1 &&
      TRAILING_PARTICLES.some((p) => token.endsWith(p))
    ) {
      token = token.slice(0, -1)
      changed = true
    }
  }
  return token
}

/**
 * 種目名トークンをマスター名へ解決する。
 * 完全一致 → 前方一致（一意） → 部分一致（一意）の順に探し、
 * 決まらなければトークンをそのまま返す（未登録種目として作成される）。
 */
function resolveExerciseName(token: string, knownNames: string[]): string {
  if (token === '') return token
  if (knownNames.includes(token)) return token
  const byPrefix = knownNames.filter((n) => n.startsWith(token))
  if (byPrefix.length === 1) return byPrefix[0]
  // 末尾一致のみを部分一致として扱う（「カール」→「アームカール」）。
  // 単なる部分一致だと「ラン」が「プランク」に誤マッチするため使わない。
  const bySuffix = knownNames.filter((n) => n.endsWith(token))
  if (bySuffix.length === 1) return bySuffix[0]
  return token
}

/** 数値部分文字列から重量・回数・セット数・時間・距離を取り出す（抽出箇所は除去しながら進める）。 */
function parseNumbers(input: string): ParsedNumbers {
  let s = input
  const out: ParsedNumbers = {}

  const duration = s.match(/(\d+(?:\.\d+)?)\s*(秒|分)/)
  if (duration) {
    out.durationText = `${duration[1]}${duration[2]}`
    s = s.replace(duration[0], ' ')
  }
  const distance = s.match(/(\d+(?:\.\d+)?)\s*km/i)
  if (distance) {
    out.distanceText = `${distance[1]}km`
    s = s.replace(distance[0], ' ')
  }

  // ×チェーン: 単位付きの数値が × でつながる列（例: 60kg×10×3 / 10回×3）
  const chain = s.match(
    /(\d+(?:\.\d+)?)\s*(kg|キロ|回|reps)?\s*×\s*(\d+(?:\.\d+)?)\s*(kg|キロ|回|reps)?(?:\s*×\s*(\d+(?:\.\d+)?))?/,
  )
  if (chain) {
    const parts: Array<{ value: number; unit?: string }> = [
      { value: Number(chain[1]), unit: chain[2] },
      { value: Number(chain[3]), unit: chain[4] },
    ]
    if (chain[5] !== undefined) parts.push({ value: Number(chain[5]) })
    // 単位付きの数値はその役割に固定し、裸の数値は出現位置に応じて
    // 重量 → 回数 → セット数 の空きスロットを順に埋める。
    const slots = ['weight', 'reps', 'setCount'] as const
    type Slot = (typeof slots)[number]
    const filled: Partial<Record<Slot, number>> = {}
    let pointer = 0
    for (const part of parts) {
      let slot: Slot | null = null
      if (part.unit === 'kg' || part.unit === 'キロ') slot = 'weight'
      else if (part.unit === '回' || part.unit === 'reps') slot = 'reps'
      if (slot !== null) {
        if (filled[slot] === undefined) filled[slot] = part.value
        pointer = Math.max(pointer, slots.indexOf(slot) + 1)
      } else {
        while (pointer < slots.length && filled[slots[pointer]] !== undefined) {
          pointer++
        }
        if (pointer < slots.length) {
          filled[slots[pointer]] = part.value
          pointer++
        }
      }
    }
    if (out.weight === undefined) out.weight = filled.weight
    if (out.reps === undefined) out.reps = filled.reps
    if (out.setCount === undefined) out.setCount = filled.setCount
    s = s.replace(chain[0], ' ')
  }

  // 時間・距離の後に残る「×2」はセット数として解釈する
  if (
    out.setCount === undefined &&
    (out.durationText !== undefined || out.distanceText !== undefined)
  ) {
    const times = s.match(/×\s*(\d+)/)
    if (times) {
      out.setCount = Number(times[1])
      s = s.replace(times[0], ' ')
    }
  }

  const setMatch = s.match(/(\d+)\s*セット/)
  if (setMatch) {
    if (out.setCount === undefined) out.setCount = Number(setMatch[1])
    s = s.replace(setMatch[0], ' ')
  }

  const weightMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:kg|キロ)/)
  if (weightMatch) {
    if (out.weight === undefined) out.weight = Number(weightMatch[1])
    s = s.replace(weightMatch[0], ' ')
  }

  const repsMatch = s.match(/(\d+)\s*(?:回|reps)/)
  if (repsMatch) {
    if (out.reps === undefined) out.reps = Number(repsMatch[1])
    s = s.replace(repsMatch[0], ' ')
  }

  // 単位なしの裸の数値: 片方だけ既知なら残りを補う。両方不明なら先行を重量とする。
  // 時間・距離のみの文脈では裸の数値を重量/回数に誤読しない。
  if (out.durationText === undefined && out.distanceText === undefined) {
    const bares = [...s.matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]))
    for (const value of bares) {
      if (out.weight === undefined && out.reps !== undefined) {
        out.weight = value
      } else if (out.reps === undefined && out.weight !== undefined) {
        out.reps = value
      } else if (out.weight === undefined && out.reps === undefined) {
        out.weight = value
      }
    }
  }

  return out
}

function buildExercise(
  exerciseName: string,
  parsed: ParsedNumbers,
): ExtractedRecordExercise {
  const exercise: ExtractedRecordExercise = { exerciseName, sets: [] }
  if (parsed.reps !== undefined && parsed.reps > 0) {
    const count = clampSetCount(parsed.setCount ?? 1)
    const weight = parsed.weight ?? 0
    exercise.sets = Array.from({ length: count }, () => ({
      weight,
      reps: parsed.reps as number,
    }))
  } else if (parsed.weight !== undefined) {
    exercise.mentionedWeight = parsed.weight
  }
  if (parsed.durationText !== undefined) {
    exercise.durationText = parsed.durationText
  }
  if (parsed.distanceText !== undefined) {
    exercise.distanceText = parsed.distanceText
  }
  if (
    exercise.sets.length === 0 &&
    parsed.setCount !== undefined &&
    (parsed.durationText !== undefined || parsed.distanceText !== undefined)
  ) {
    exercise.mentionedSets = clampSetCount(parsed.setCount)
  }
  return exercise
}

/** 数値だけのセグメントを、直前の種目の追加セットとして解釈する。 */
function applyToCurrent(
  current: ExtractedRecordExercise,
  parsed: ParsedNumbers,
): void {
  if (parsed.reps !== undefined && parsed.reps > 0) {
    const lastWeight =
      current.sets.length > 0
        ? current.sets[current.sets.length - 1].weight
        : (current.mentionedWeight ?? 0)
    const weight = parsed.weight ?? lastWeight
    const count = clampSetCount(parsed.setCount ?? 1)
    for (let i = 0; i < count; i++) {
      current.sets.push({ weight, reps: parsed.reps })
    }
    return
  }
  if (parsed.weight !== undefined && current.mentionedWeight === undefined) {
    current.mentionedWeight = parsed.weight
  }
  if (parsed.durationText !== undefined && current.durationText === undefined) {
    current.durationText = parsed.durationText
  }
  if (parsed.distanceText !== undefined && current.distanceText === undefined) {
    current.distanceText = parsed.distanceText
  }
  if (parsed.setCount !== undefined && current.mentionedSets === undefined) {
    current.mentionedSets = parsed.setCount
  }
}

export function extractRecordExercises(
  text: string,
  knownNames: string[],
): ExtractedRecordExercise[] {
  const normalized = normalizeText(text)
  const segments = normalized
    .split(/[、。，\n]/)
    .map((seg) => seg.trim())
    .filter((seg) => seg !== '')

  const results: ExtractedRecordExercise[] = []
  const sortedKnown = [...knownNames].sort((a, b) => b.length - a.length)

  const pushExercise = (exercise: ExtractedRecordExercise) => {
    const existing = results.find((e) => e.exerciseName === exercise.exerciseName)
    if (existing) {
      existing.sets.push(...exercise.sets)
      if (existing.mentionedWeight === undefined) {
        existing.mentionedWeight = exercise.mentionedWeight
      }
      if (existing.durationText === undefined) {
        existing.durationText = exercise.durationText
      }
      if (existing.distanceText === undefined) {
        existing.distanceText = exercise.distanceText
      }
      if (existing.mentionedSets === undefined) {
        existing.mentionedSets = exercise.mentionedSets
      }
      return existing
    }
    results.push(exercise)
    return exercise
  }

  for (const segment of segments) {
    // マスター名がそのまま含まれる場合はそれを種目名とする
    const knownHit = sortedKnown.find((name) => segment.includes(name))

    let exerciseName: string | null = null
    let rest = segment

    if (knownHit) {
      exerciseName = knownHit
      rest = segment.replace(knownHit, ' ')
    } else {
      // 「5kmラン」のように距離が先行する形は、後続トークンを種目名とする
      const distanceFirst = segment.match(
        /^(\d+(?:\.\d+)?\s*km)\s*([^0-9×\s]+)/i,
      )
      const leadMatch = segment.match(/^[^0-9×\s]+/)
      if (distanceFirst) {
        const token = cleanNameToken(distanceFirst[2])
        const resolved = resolveExerciseName(token, knownNames)
        if (
          token !== '' &&
          (resolved !== token || isPlausibleNewExerciseName(token))
        ) {
          exerciseName = resolved
          rest = segment.slice(distanceFirst[1].length).replace(distanceFirst[2], ' ')
          // 距離そのものは parseNumbers で拾い直すため rest に戻す
          rest = `${distanceFirst[1]} ${rest}`
        }
      } else if (leadMatch) {
        const token = cleanNameToken(leadMatch[0])
        const hasDigits = /[0-9]/.test(segment)
        const hasCompletion = COMPLETION_SUFFIXES.some((sfx) =>
          segment.includes(sfx),
        )
        const isQuestion = /[？?]/.test(segment)
        const resolved = resolveExerciseName(token, knownNames)
        // マスター名（略称含む）に解決できる場合は種目として扱う。
        // 未登録名は「種目らしい接頭辞」の場合だけ新規種目として採用する。
        const acceptable =
          resolved !== token || isPlausibleNewExerciseName(token)
        if (token !== '' && !isQuestion && (hasDigits || hasCompletion) && acceptable) {
          exerciseName = resolved
          rest = segment.slice(leadMatch[0].length)
        }
      }
    }

    const parsed = parseNumbers(rest)

    if (exerciseName !== null) {
      pushExercise(buildExercise(exerciseName, parsed))
    } else if (results.length > 0 && !/^[^0-9×\s]/.test(segment)) {
      // 数値から始まる名前なしセグメントは、直前の種目への追加情報として
      // 解釈する（例: 「…60kgで10回、9回、8回」の 9回・8回）。
      // 文字から始まる節は独立した文（計画・感想など）なので、
      // 種目として採用しなかったものを直前の種目へも付けない。
      // 数値が何もなければ感想・質問などの文として無視する。
      const hasNumbers =
        parsed.weight !== undefined ||
        parsed.reps !== undefined ||
        parsed.setCount !== undefined ||
        parsed.durationText !== undefined ||
        parsed.distanceText !== undefined
      if (hasNumbers) {
        applyToCurrent(results[results.length - 1], parsed)
      }
    }
  }

  return results
}
