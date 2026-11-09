import { describe, it, expect } from 'vitest'
import {
  buildIntentCandidateActions,
  buildEditTargetActions,
  formatExtractedExerciseLine,
  ADVICE_KEYLESS_MESSAGE,
  OTHER_KEYLESS_MESSAGE,
  RECORD_NAME_MISSING_MESSAGE,
  INTENT_CHIPS_PROMPT,
  EDIT_CHIPS_PROMPT,
  EDIT_NO_DRAFT_MESSAGE,
} from './intentResponses'
import { makeDraftExercise } from '../../test/fixtures/draftExercise'

describe('buildIntentCandidateActions', () => {
  it('候補ラベルを intent-route アクションに変換する', () => {
    const actions = buildIntentCandidateActions(
      ['record', 'history'],
      'あいまいな入力',
    )
    expect(actions).toEqual([
      {
        id: 'intent-record',
        label: '記録する',
        kind: 'intent-route',
        payload: { intent: 'record', text: 'あいまいな入力' },
      },
      {
        id: 'intent-history',
        label: '履歴を見る',
        kind: 'intent-route',
        payload: { intent: 'history', text: 'あいまいな入力' },
      },
    ])
  })

  it('全ラベルに表示名がある', () => {
    const actions = buildIntentCandidateActions(
      ['advice', 'edit', 'other'],
      'x',
    )
    expect(actions.map((a) => a.label)).toEqual([
      'アドバイスをもらう',
      '記録を修正する',
      'その他',
    ])
  })
})

describe('buildEditTargetActions', () => {
  it('draft の種目を edit-target アクションに変換する', () => {
    const actions = buildEditTargetActions([
      makeDraftExercise({ exerciseId: 'ex-1', exerciseName: 'ベンチプレス' }),
      makeDraftExercise({ exerciseId: 'ex-2', exerciseName: 'スクワット' }),
    ])
    expect(actions).toEqual([
      {
        id: 'edit-target-ex-1',
        label: 'ベンチプレス',
        kind: 'edit-target',
        payload: { exerciseId: 'ex-1', exerciseName: 'ベンチプレス' },
      },
      {
        id: 'edit-target-ex-2',
        label: 'スクワット',
        kind: 'edit-target',
        payload: { exerciseId: 'ex-2', exerciseName: 'スクワット' },
      },
    ])
  })
})

describe('formatExtractedExerciseLine', () => {
  it('セットがある場合は要約を表示する', () => {
    expect(
      formatExtractedExerciseLine({
        exerciseName: 'ベンチプレス',
        sets: [
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
          { weight: 60, reps: 10 },
        ],
      }),
    ).toBe('ベンチプレス: 60kg×10回 ×3セット')
  })

  it('時間のみの場合は時間と空欄挿入の注記を表示する', () => {
    expect(
      formatExtractedExerciseLine({
        exerciseName: 'プランク',
        sets: [],
        durationText: '60秒',
        mentionedSets: 2,
      }),
    ).toBe('プランク: 60秒 ×2セット（セットは空欄で挿入しました）')
  })

  it('重量のみの場合は重量と未入力の注記を表示する', () => {
    expect(
      formatExtractedExerciseLine({
        exerciseName: 'デッドリフト',
        sets: [],
        mentionedWeight: 140,
      }),
    ).toBe('デッドリフト: 140kg（回数はカードで入力してください）')
  })

  it('数値なしの場合はその旨を表示する', () => {
    expect(
      formatExtractedExerciseLine({ exerciseName: 'ベンチプレス', sets: [] }),
    ).toBe('ベンチプレス: カードを追加しました（数値なし）')
  })
})

describe('固定文言', () => {
  it('advice のキーなし案内は設定画面への導線を含む', () => {
    expect(ADVICE_KEYLESS_MESSAGE).toContain('APIキー')
    expect(ADVICE_KEYLESS_MESSAGE).toContain('設定')
  })

  it('other のキーなし応答は定型文である', () => {
    expect(OTHER_KEYLESS_MESSAGE.length).toBeGreaterThan(0)
  })

  it('record の種目名不足の案内は入力例を含む', () => {
    expect(RECORD_NAME_MISSING_MESSAGE).toContain('ベンチプレス 60kg 10回×3')
  })

  it('チップのプロンプト文が定義されている', () => {
    expect(INTENT_CHIPS_PROMPT.length).toBeGreaterThan(0)
    expect(EDIT_CHIPS_PROMPT.length).toBeGreaterThan(0)
    expect(EDIT_NO_DRAFT_MESSAGE.length).toBeGreaterThan(0)
  })
})
