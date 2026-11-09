import { describe, it, expect } from 'vitest'
import { findMentionedExerciseName } from './exerciseMention'

describe('findMentionedExerciseName', () => {
  it('正式名がそのまま含まれればそれを返す', () => {
    expect(findMentionedExerciseName('ベンチプレスの履歴は？', ['ベンチプレス'])).toBe(
      'ベンチプレス',
    )
  })

  it('略称（前方一致）でも特定できる', () => {
    expect(findMentionedExerciseName('ベンチの記録は？', ['ベンチプレス'])).toBe(
      'ベンチプレス',
    )
  })

  it('別の種目名に埋め込まれた一致は拾わない', () => {
    // 「ラン」が登録されていても「プランク」の一部として誤認しない
    expect(findMentionedExerciseName('プランクの履歴は？', ['ラン'])).toBeNull()
    expect(findMentionedExerciseName('プランクの履歴は？', ['ラン', 'プランク'])).toBe(
      'プランク',
    )
    // 略称の前方一致でも、カタカナ語の途中の一致は拾わない
    expect(findMentionedExerciseName('プランニングの話', ['プランク'])).toBeNull()
  })

  it('数字や助詞に隣接する単独の種目名は拾う', () => {
    expect(findMentionedExerciseName('5kmランの記録', ['ラン'])).toBe('ラン')
    expect(findMentionedExerciseName('ランの履歴は？', ['ラン'])).toBe('ラン')
  })

  it('言及がなければ null を返す', () => {
    expect(findMentionedExerciseName('昨日の記録は？', ['ベンチプレス'])).toBeNull()
  })
})
