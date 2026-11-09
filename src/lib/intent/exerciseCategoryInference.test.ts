import { describe, it, expect } from 'vitest'
import { inferExerciseCategory } from './exerciseCategoryInference'

describe('inferExerciseCategory（種目名からの部位推定）', () => {
  it('代表的な種目名から部位を推定する', () => {
    expect(inferExerciseCategory('ベンチプレス')).toBe('chest')
    expect(inferExerciseCategory('チェストプレス')).toBe('chest')
    expect(inferExerciseCategory('ダンベルフライ')).toBe('chest')
    expect(inferExerciseCategory('ラットプルダウン')).toBe('back')
    expect(inferExerciseCategory('デッドリフト')).toBe('back')
    expect(inferExerciseCategory('懸垂')).toBe('back')
    expect(inferExerciseCategory('ベントオーバーロー')).toBe('back')
    expect(inferExerciseCategory('ショルダープレス')).toBe('shoulders')
    expect(inferExerciseCategory('サイドレイズ')).toBe('shoulders')
    expect(inferExerciseCategory('アームカール')).toBe('arms')
    expect(inferExerciseCategory('スクワット')).toBe('legs')
    expect(inferExerciseCategory('レッグプレス')).toBe('legs')
    expect(inferExerciseCategory('ランジ')).toBe('legs')
    expect(inferExerciseCategory('ヒップスラスト')).toBe('legs')
    expect(inferExerciseCategory('プランク')).toBe('core')
    expect(inferExerciseCategory('クランチ')).toBe('core')
    expect(inferExerciseCategory('ラン')).toBe('cardio')
    expect(inferExerciseCategory('ランニング')).toBe('cardio')
  })

  it('「レッグ」を含んでも体幹種目（レッグレイズ）は core と判定する', () => {
    expect(inferExerciseCategory('レッグレイズ')).toBe('core')
  })

  it('リア系のフライは胸ではなく肩と判定する', () => {
    expect(inferExerciseCategory('リアデルトフライ')).toBe('shoulders')
    expect(inferExerciseCategory('リアフライ')).toBe('shoulders')
    expect(inferExerciseCategory('リバースフライ')).toBe('shoulders')
  })

  it('「ロープ」始まりの腕種目は「ロー」に引っ張られず arms と判定する', () => {
    expect(inferExerciseCategory('ロープカール')).toBe('arms')
    expect(inferExerciseCategory('ローププレスダウン')).toBe('arms')
  })

  it('判断できない種目名は undefined（未分類に委ねる）', () => {
    expect(inferExerciseCategory('プルオーバー')).toBeUndefined()
    expect(inferExerciseCategory('ダンベルプレス')).toBeUndefined()
    expect(inferExerciseCategory('なぞの種目')).toBeUndefined()
  })
})
