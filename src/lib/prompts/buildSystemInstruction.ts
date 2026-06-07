import type { TrainingGoal, UserProfile } from '../../stores/userProfileStore'
import { todayDateString } from '../../schemas/date'
import { SYSTEM_INSTRUCTION } from './systemInstruction'

const TRAINING_GOAL_LABELS: Record<TrainingGoal, string> = {
  muscle_gain: '筋肥大（サイズアップ）',
  strength: '筋力アップ（パワー）',
  fat_loss: '減量・ダイエット',
  maintenance: '維持・健康増進',
  performance: '競技パフォーマンス向上',
}

// Composes the final system instruction sent to Gemini:
//   <SYSTEM_INSTRUCTION>
//   + <profile block>           (if any profile field is set)
//   + <session-context block>   (if sessionContext is non-empty)
//   + <today-date block>
// Living in prompts/ keeps all prompt logic in one module — geminiClient.ts is
// pure SDK plumbing.
export function buildSystemInstruction(
  profile: UserProfile | null,
  sessionContext?: string | null,
): string {
  const todaySection = `\n\n## 今日の日付\n今日の日付は ${todayDateString()} です。日付が明示されていない場合はこの日付を使用してください。`
  const sessionSection =
    sessionContext && sessionContext.trim() !== ''
      ? `\n\n## 進行中のセッション\n${sessionContext}\n\n上記のセッション状況を踏まえて、次セットの重量・回数のアドバイスや、進捗に応じた助言をしてください。`
      : ''

  const profileEmpty =
    !profile ||
    (profile.birthYear === null &&
      profile.weightKg === null &&
      profile.heightCm === null &&
      profile.trainingGoal === null)

  if (profileEmpty) return SYSTEM_INSTRUCTION + sessionSection + todaySection

  const { birthYear, weightKg, heightCm, trainingGoal } = profile
  const lines: string[] = []
  if (birthYear !== null) {
    const age = new Date().getFullYear() - birthYear
    lines.push(`- 年齢: ${age}歳（${birthYear}年生まれ）`)
  }
  if (weightKg !== null) {
    lines.push(`- 体重: ${weightKg}kg`)
  }
  if (heightCm !== null) {
    let line = `- 身長: ${heightCm}cm`
    if (weightKg !== null) {
      const bmi = weightKg / Math.pow(heightCm / 100, 2)
      line += `（BMI: ${bmi.toFixed(1)}）`
    }
    lines.push(line)
  }
  if (trainingGoal !== null) {
    lines.push(`- トレーニング目的: ${TRAINING_GOAL_LABELS[trainingGoal]}`)
  }

  return `${SYSTEM_INSTRUCTION}\n\n## ユーザープロフィール\n${lines.join('\n')}\n\n上記の情報を踏まえてアドバイスやメニュー提案を個人化してください。${sessionSection}${todaySection}`
}
