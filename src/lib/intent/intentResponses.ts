import type { ProposedAction } from '../../types/chat'
import type { DraftExercise } from '../../schemas/workout'
import type { IntentLabel } from './intentClassifier'
import type { ExtractedRecordExercise } from './recordExtractor'
import { formatSetsSummary } from './formatSets'

// ローカルルーティングで使う固定文言と候補チップの構築
// （intent-router FR_002 / FR_003 / FR_005）。

export const INTENT_CHIPS_PROMPT = 'どの操作か選んでください。'

export const EDIT_CHIPS_PROMPT = 'どの記録を修正しますか？'

export const ADVICE_KEYLESS_MESSAGE =
  'アドバイスには Gemini APIキーの設定が必要です。設定画面（右上の歯車アイコン）からAPIキーを入力してください。なお、記録と履歴の確認はキーなしでも利用できます。'

export const OTHER_KEYLESS_MESSAGE =
  'こんにちは！トレーニングの記録や履歴の確認ができます。「ベンチプレス 60kg 10回×3」のように入力すると、そのまま記録できます。'

export const RECORD_NAME_MISSING_MESSAGE =
  '種目名が読み取れませんでした。「ベンチプレス 60kg 10回×3」のように、種目名を含めて入力してください。'

export const EDIT_NO_DRAFT_MESSAGE =
  '修正できる記録がまだセッションにありません。先に記録を追加してください。'

export const INTENT_CHIP_LABELS: Record<IntentLabel, string> = {
  record: '記録する',
  history: '履歴を見る',
  advice: 'アドバイスをもらう',
  edit: '記録を修正する',
  other: 'その他',
}

/** 分類で確定しなかったときの候補チップ（FR_002）。タップで元の入力を選んだ意図として再ルーティングする。 */
export function buildIntentCandidateActions(
  candidates: IntentLabel[],
  text: string,
): ProposedAction[] {
  return candidates.map((label) => ({
    id: `intent-${label}`,
    label: INTENT_CHIP_LABELS[label],
    kind: 'intent-route',
    payload: { intent: label, text },
  }))
}

/** edit の対象を特定できないときの対象選択チップ（FR_005）。 */
export function buildEditTargetActions(
  draftExercises: DraftExercise[],
): ProposedAction[] {
  return draftExercises.map((d) => ({
    id: `edit-target-${d.exerciseId}`,
    label: d.exerciseName,
    kind: 'edit-target',
    payload: { exerciseId: d.exerciseId, exerciseName: d.exerciseName },
  }))
}

/** record の抽出結果 1 件分を確認メッセージ用に整形する。 */
export function formatExtractedExerciseLine(
  exercise: ExtractedRecordExercise,
): string {
  if (exercise.sets.length > 0) {
    return `${exercise.exerciseName}: ${formatSetsSummary(exercise.sets)}`
  }
  const timeOrDistance = [exercise.distanceText, exercise.durationText]
    .filter((v): v is string => v !== undefined)
    .join(' ')
  if (timeOrDistance !== '') {
    const setsNote =
      exercise.mentionedSets !== undefined
        ? ` ×${exercise.mentionedSets}セット`
        : ''
    return `${exercise.exerciseName}: ${timeOrDistance}${setsNote}（セットは空欄で挿入しました）`
  }
  if (exercise.mentionedWeight !== undefined) {
    return `${exercise.exerciseName}: ${exercise.mentionedWeight}kg（回数はカードで入力してください）`
  }
  return `${exercise.exerciseName}: カードを追加しました（数値なし）`
}
