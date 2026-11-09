import type { Workout } from '../../schemas/workout'
import type { DateString } from '../../schemas/date'
import { formatSetsSummary } from './formatSets'
import { findMentionedExerciseName } from './exerciseMention'

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

function formatExerciseLine(name: string, sets: Workout['exercises'][number]['sets']): string {
  const summary = formatSetsSummary(sets)
  return summary === '' ? `${name}（セット未入力）` : `${name}: ${summary}`
}

export function buildHistoryResponse(
  text: string,
  workouts: Workout[],
  exerciseNames: string[],
  today: DateString,
): string {
  if (workouts.length === 0) {
    return 'まだ記録がありません。'
  }

  const hint = findDateHint(text, today)

  // 種目名が文中にあれば、その種目の直近記録を優先する。
  // 日付ヒントもあれば両方で絞る（「昨日ベンチ何kgだった？」など）。
  const targetName = findMentionedExerciseName(text, exerciseNames)
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
    const matched = workouts.filter((w) =>
      w.exercises.some((e) => e.exerciseName === targetName),
    )
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
