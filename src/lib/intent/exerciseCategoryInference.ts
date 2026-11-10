import type { ExerciseCategory } from '../../schemas/exercise'

// 種目名からの部位（カテゴリ）推定。LLM 経路では system 指示でモデルに
// 推定させているが、ローカルルーティング（キーなし含む）では推定しないと
// 新規種目が未分類（unassigned）で登録され、部位で絞る履歴検索
// （「今月の脚の日」等）から漏れてしまう。代表的なキーワードだけで
// 保守的に判定し、判断できない場合は undefined を返して未分類に委ねる
// （LLM 側の運用「判断できない種目は category を省略する」と同じ）。
// 並び順が優先順位: 「レッグレイズ」（体幹）を「レッグ」（脚）より先に、
// 「プランク」（体幹）や「ランジ」（脚）を「ラン」（有酸素）より先に、
// リア系フライ（肩）を汎用の「フライ」（胸）より先に判定する。
const CATEGORY_KEYWORDS: Array<{
  category: ExerciseCategory
  keywords: string[]
}> = [
  {
    category: 'core',
    keywords: ['プランク', 'クランチ', 'シットアップ', 'レッグレイズ'],
  },
  {
    category: 'legs',
    keywords: [
      'スクワット',
      'レッグ',
      'ランジ',
      'ブルガリアン',
      'ヒップ',
      'カーフ',
      'アダクション',
      'アブダクション',
    ],
  },
  {
    category: 'back',
    keywords: [
      'デッドリフト',
      'ラットプル',
      '懸垂',
      'チンニング',
      'プルアップ',
      'シュラッグ',
      'ロー',
      'ロウ',
    ],
  },
  {
    category: 'shoulders',
    keywords: [
      'ショルダー',
      'サイドレイズ',
      'フロントレイズ',
      'リアレイズ',
      'リアデルト',
      'リアフライ',
      'リバースフライ',
      'オーバーヘッド',
    ],
  },
  { category: 'chest', keywords: ['ベンチ', 'チェスト', 'ペック', 'フライ'] },
  {
    category: 'arms',
    keywords: ['カール', 'トライセプス', 'キックバック', 'プレスダウン'],
  },
  {
    category: 'cardio',
    keywords: ['ラン', 'バイク', 'トレッドミル', 'ウォーキング', '水泳', 'スイム'],
  },
]

// 「ロー」は「ロープカール」のようにケーブル器具の接頭辞「ロープ」の
// 先頭にも現れるため、直後が「プ」の場合は背中種目の「ロー」とみなさない。
function matchesKeyword(exerciseName: string, keyword: string): boolean {
  if (keyword !== 'ロー') return exerciseName.includes(keyword)
  let idx = exerciseName.indexOf('ロー')
  while (idx !== -1) {
    if (exerciseName[idx + 2] !== 'プ') return true
    idx = exerciseName.indexOf('ロー', idx + 1)
  }
  return false
}

export function inferExerciseCategory(
  exerciseName: string,
): ExerciseCategory | undefined {
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => matchesKeyword(exerciseName, k))) return category
  }
  return undefined
}
