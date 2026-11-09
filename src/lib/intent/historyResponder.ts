import type { Workout } from '../../schemas/workout'
import type { DateString } from '../../schemas/date'
import type { ExerciseCategory } from '../../schemas/exercise'
import { formatSetsSummary } from './formatSets'
import { findMentionedExerciseName } from './exerciseMention'
import { inferExerciseCategory } from './exerciseCategoryInference'

// history 意図のローカル検索（intent-router FR_003）。
// 端末内の過去セッションだけを使い、シンプルなテキストで返す（§6 決定）。
// LLM は使わないためキーなしでも完結する。

const MAX_EXERCISE_HISTORY = 3
const MAX_RECENT_WORKOUTS = 3

function formatDateLabel(date: DateString): string {
  const [, month, day] = date.split('-')
  return `${Number(month)}/${Number(day)}`
}

function shiftDate(today: DateString, deltaDays: number): DateString {
  const d = new Date(`${today}T00:00:00`)
  d.setDate(d.getDate() + deltaDays)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}` as DateString
}

function findDateHint(
  text: string,
  today: DateString,
): { date: DateString; label: string } | null {
  if (text.includes('一昨日')) {
    return { date: shiftDate(today, -2), label: '一昨日' }
  }
  if (text.includes('昨日')) {
    return { date: shiftDate(today, -1), label: '昨日' }
  }
  if (text.includes('今日')) {
    return { date: today, label: '今日' }
  }
  return null
}

type PeriodHint = { start: DateString; end: DateString; label: string }

function dateParts(date: DateString): { y: number; m: number } {
  const [y, m] = date.split('-').map(Number)
  return { y, m }
}

function monthStart(y: number, m: number): DateString {
  return `${y}-${String(m).padStart(2, '0')}-01` as DateString
}

/** 期間ヒント（今週・先週・今月・先月）。週は月曜始まりとする。 */
function findPeriodHint(text: string, today: DateString): PeriodHint | null {
  const { y, m } = dateParts(today)
  if (text.includes('先月')) {
    const py = m === 1 ? y - 1 : y
    const pm = m === 1 ? 12 : m - 1
    // 先月の末日は今月1日の前日
    return { start: monthStart(py, pm), end: shiftDate(monthStart(y, m), -1), label: '先月' }
  }
  if (text.includes('今月')) {
    return { start: monthStart(y, m), end: today, label: '今月' }
  }
  // 月曜始まり: 日曜=0 の getDay を 月曜=0 へ変換する
  const dow = new Date(`${today}T00:00:00`).getDay()
  const toMonday = (dow + 6) % 7
  if (text.includes('先週')) {
    return {
      start: shiftDate(today, -toMonday - 7),
      end: shiftDate(today, -toMonday - 1),
      label: '先週',
    }
  }
  if (text.includes('今週')) {
    return { start: shiftDate(today, -toMonday), end: today, label: '今週' }
  }
  return null
}

type GroupHint = { category: ExerciseCategory; label: string }

const GROUP_HINTS: Array<{ keywords: string[]; category: ExerciseCategory; label: string }> = [
  { keywords: ['脚', '下半身'], category: 'legs', label: '脚' },
  { keywords: ['胸'], category: 'chest', label: '胸' },
  { keywords: ['背中'], category: 'back', label: '背中' },
  { keywords: ['肩'], category: 'shoulders', label: '肩' },
  { keywords: ['腕'], category: 'arms', label: '腕' },
  { keywords: ['腹筋', '体幹'], category: 'core', label: '体幹' },
  { keywords: ['有酸素'], category: 'cardio', label: '有酸素' },
]

function findGroupHint(text: string): GroupHint | null {
  for (const g of GROUP_HINTS) {
    if (g.keywords.some((k) => text.includes(k))) {
      return { category: g.category, label: g.label }
    }
  }
  return null
}

const MAX_PERIOD_WORKOUTS = 10

function formatExerciseLine(name: string, sets: Workout['exercises'][number]['sets']): string {
  const summary = formatSetsSummary(sets)
  return summary === '' ? `${name}（セット未入力）` : `${name}: ${summary}`
}

export function buildHistoryResponse(
  text: string,
  workouts: Workout[],
  exerciseNames: string[],
  today: DateString,
  categoryByExerciseId?: ReadonlyMap<string, ExerciseCategory>,
): string {
  if (workouts.length === 0) {
    return 'まだ記録がありません。'
  }

  const hint = findDateHint(text, today)
  const period = findPeriodHint(text, today)
  const group = findGroupHint(text)

  // 種目名が文中にあれば、その種目の直近記録を優先する。
  // 日付ヒントもあれば両方で絞る（「昨日ベンチ何kgだった？」など）。
  // 言及の解決は現在のマスター名に加え、保存済みの記録に残る
  // 名前スナップショットに対しても行う（改名・削除済みの種目でも
  // 過去の記録は当時の名前で引けるように）。
  const mentionNames = [
    ...new Set([
      ...exerciseNames,
      ...workouts.flatMap((w) => w.exercises.map((e) => e.exerciseName)),
    ]),
  ]
  const targetName = findMentionedExerciseName(text, mentionNames)
  if (targetName && hint) {
    const dayWorkouts = workouts.filter((w) => w.date === hint.date)
    // 同じ日に同種目のセッションが複数ありうるため、全件を対象にする
    const entries = dayWorkouts
      .flatMap((w) => w.exercises)
      .filter((e) => e.exerciseName === targetName)
    if (entries.length === 0) {
      return `${hint.label}の${targetName}の記録はありません。`
    }
    const lines = entries.map((entry) => {
      const summary = formatSetsSummary(entry.sets)
      return summary === '' ? '・（セット未入力）' : `・${summary}`
    })
    return [`${hint.label}の${targetName}の記録です。`, ...lines].join('\n')
  }
  if (targetName) {
    let matched = workouts.filter((w) =>
      w.exercises.some((e) => e.exerciseName === targetName),
    )
    if (period) {
      matched = matched.filter(
        (w) => w.date >= period.start && w.date <= period.end,
      )
      if (matched.length === 0) {
        return `${period.label}の${targetName}の記録はありません。`
      }
    }
    if (matched.length === 0) {
      return `${targetName}の記録はまだありません。`
    }
    const lines = matched.slice(0, MAX_EXERCISE_HISTORY).map((w) => {
      const entry = w.exercises.find((e) => e.exerciseName === targetName)
      const summary = entry ? formatSetsSummary(entry.sets) : ''
      return summary === ''
        ? `・${formatDateLabel(w.date)}: （セット未入力）`
        : `・${formatDateLabel(w.date)}: ${summary}`
    })
    return [`${targetName}の直近の記録です。`, ...lines].join('\n')
  }

  // マスターから削除済みの種目は対応表に無いため、保存済みの
  // 名前スナップショットから部位を推定して補う（推定できなければ対象外）。
  const inGroup = (e: Workout['exercises'][number]): boolean => {
    if (!group) return false
    const category =
      categoryByExerciseId?.get(e.exerciseId) ??
      inferExerciseCategory(e.exerciseName)
    return category === group.category
  }

  if (hint && group) {
    const dayWorkouts = workouts.filter((w) => w.date === hint.date)
    const lines: string[] = []
    for (const w of dayWorkouts) {
      for (const e of w.exercises) {
        if (inGroup(e)) {
          lines.push(`・${formatExerciseLine(e.exerciseName, e.sets)}`)
        }
      }
    }
    if (lines.length === 0) {
      return `${hint.label}の${group.label}の記録はありません。`
    }
    return [`${hint.label}の${group.label}の記録です。`, ...lines].join('\n')
  }

  if (period || group) {
    const label = [period?.label, group?.label].filter(Boolean).join('の')
    const ranged = period
      ? workouts.filter((w) => w.date >= period.start && w.date <= period.end)
      : workouts
    const lines: string[] = []
    for (const w of ranged) {
      const exs = group ? w.exercises.filter(inGroup) : w.exercises
      if (exs.length === 0) continue
      lines.push(
        `・${formatDateLabel(w.date)}: ${exs.map((e) => formatExerciseLine(e.exerciseName, e.sets)).join('、')}`,
      )
      if (lines.length >= MAX_PERIOD_WORKOUTS) break
    }
    if (lines.length === 0) {
      return `${label}の記録はありません。`
    }
    return [`${label}の記録です。`, ...lines].join('\n')
  }

  if (hint) {
    const dayWorkouts = workouts.filter((w) => w.date === hint.date)
    if (dayWorkouts.length === 0) {
      return `${hint.label}の記録はありません。`
    }
    const lines: string[] = []
    for (const w of dayWorkouts) {
      for (const e of w.exercises) {
        lines.push(`・${formatExerciseLine(e.exerciseName, e.sets)}`)
      }
    }
    return [`${hint.label}の記録です。`, ...lines].join('\n')
  }

  const lines = workouts.slice(0, MAX_RECENT_WORKOUTS).map((w) => {
    const parts = w.exercises.map((e) => formatExerciseLine(e.exerciseName, e.sets))
    return `・${formatDateLabel(w.date)}: ${parts.join('、')}`
  })
  return ['直近の記録です。', ...lines].join('\n')
}
