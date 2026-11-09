import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  appendIntentFeedback,
  clearIntentFeedback,
  readIntentFeedback,
  resetRoutedRecordTracking,
  syncRoutedRecordTracking,
  trackRoutedRecord,
} from './feedbackLog'
import { makeDraftExercise } from '../../test/fixtures/draftExercise'

beforeEach(() => {
  localStorage.clear()
  resetRoutedRecordTracking()
})

describe('intent feedback log', () => {
  it('分類結果を端末内に保存し、読み戻せる', () => {
    appendIntentFeedback({
      kind: 'classified',
      text: 'ベンチ60kg10回',
      scores: { record: 0.9, history: 0.1, advice: 0.1, edit: 0.05, other: 0.1 },
      decided: ['record'],
      candidates: [],
    })
    const entries = readIntentFeedback()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      kind: 'classified',
      text: 'ベンチ60kg10回',
      decided: ['record'],
    })
    expect(entries[0].id).toBeTruthy()
    expect(entries[0].timestamp).toBeTruthy()
  })

  it('チップ選択を保存できる', () => {
    appendIntentFeedback({
      kind: 'chip-choice',
      text: 'あいまいな入力',
      chosenIntent: 'history',
    })
    expect(readIntentFeedback()[0]).toMatchObject({
      kind: 'chip-choice',
      chosenIntent: 'history',
    })
  })

  it('壊れた保存データは空配列にフォールバックする', () => {
    localStorage.setItem('gymini:intent-feedback', '{broken json')
    expect(readIntentFeedback()).toEqual([])
    localStorage.setItem('gymini:intent-feedback', JSON.stringify([{ kind: 'nope' }]))
    expect(readIntentFeedback()).toEqual([])
  })

  it('上限を超えたら古いものから捨てる', () => {
    for (let i = 0; i < 205; i++) {
      appendIntentFeedback({ kind: 'classified', text: `入力${i}` })
    }
    const entries = readIntentFeedback()
    expect(entries.length).toBeLessThanOrEqual(200)
    expect(entries[entries.length - 1].text).toBe('入力204')
  })

  it('clear で全件消える', () => {
    appendIntentFeedback({ kind: 'classified', text: 'x' })
    clearIntentFeedback()
    expect(readIntentFeedback()).toEqual([])
  })
})

describe('routed record tracking (FR_007: 取り消し・修正の記録)', () => {
  it('ルーティングで挿入した種目が draft から消えたら record-removed を記録する', () => {
    trackRoutedRecord({
      text: 'ベンチ60kg10回',
      exerciseId: 'ex-bench',
      exerciseName: 'ベンチプレス',
      sets: [{ weight: 60, reps: 10 }],
    })
    syncRoutedRecordTracking([
      makeDraftExercise({
        exerciseId: 'ex-bench',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 60, reps: 10 }],
      }),
    ], true)
    expect(readIntentFeedback()).toEqual([])

    syncRoutedRecordTracking([], true)
    const entries = readIntentFeedback()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      kind: 'record-removed',
      text: 'ベンチ60kg10回',
      exerciseName: 'ベンチプレス',
    })

    // 二度目の同期では重複記録しない
    syncRoutedRecordTracking([], true)
    expect(readIntentFeedback()).toHaveLength(1)
  })

  it('ルーティングで挿入した種目のセットが変わったら record-edited を記録する', () => {
    trackRoutedRecord({
      text: 'ベンチ60kg10回',
      exerciseId: 'ex-bench',
      exerciseName: 'ベンチプレス',
      sets: [{ weight: 60, reps: 10 }],
    })
    syncRoutedRecordTracking([
      makeDraftExercise({
        exerciseId: 'ex-bench',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 65, reps: 10 }],
      }),
    ], true)
    const entries = readIntentFeedback()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      kind: 'record-edited',
      exerciseName: 'ベンチプレス',
    })

    // 同じ内容での再同期では重複記録しない
    syncRoutedRecordTracking([
      makeDraftExercise({
        exerciseId: 'ex-bench',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 65, reps: 10 }],
      }),
    ], true)
    expect(readIntentFeedback()).toHaveLength(1)
  })

  it('追跡していない種目の変化は記録しない', () => {
    syncRoutedRecordTracking([
      makeDraftExercise({ exerciseId: 'ex-other', exerciseName: '懸垂', sets: [] }),
    ], true)
    syncRoutedRecordTracking([], true)
    expect(readIntentFeedback()).toEqual([])
  })

  it('セット編集中の一時的なバッファ移動では record-edited を記録しない', () => {
    trackRoutedRecord({
      text: 'ベンチ60kg10回',
      exerciseId: 'ex-bench',
      exerciseName: 'ベンチプレス',
      sets: [{ weight: 60, reps: 10 }],
    })
    // editCompletedSet 相当: セットが sets から pendingSet へ移った状態
    syncRoutedRecordTracking([
      makeDraftExercise({
        exerciseId: 'ex-bench',
        exerciseName: 'ベンチプレス',
        sets: [],
        pendingSet: { weight: 60, reps: 10 },
        editingSetIndex: 0,
        cardState: 'recording',
      }),
    ], true)
    expect(readIntentFeedback()).toEqual([])
    // カードを畳んで元に戻した状態でも記録しない
    syncRoutedRecordTracking([
      makeDraftExercise({
        exerciseId: 'ex-bench',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 60, reps: 10 }],
      }),
    ], true)
    expect(readIntentFeedback()).toEqual([])
  })

  it('編集中に値を変えたら record-edited を1回だけ記録する', () => {
    trackRoutedRecord({
      text: 'ベンチ60kg10回',
      exerciseId: 'ex-bench',
      exerciseName: 'ベンチプレス',
      sets: [{ weight: 60, reps: 10 }],
    })
    syncRoutedRecordTracking([
      makeDraftExercise({
        exerciseId: 'ex-bench',
        exerciseName: 'ベンチプレス',
        sets: [],
        pendingSet: { weight: 65, reps: 10 },
        editingSetIndex: 0,
        cardState: 'recording',
      }),
    ], true)
    expect(readIntentFeedback()).toHaveLength(1)
    expect(readIntentFeedback()[0]).toMatchObject({ kind: 'record-edited' })
    // 完了して sets に戻った状態では重複記録しない
    syncRoutedRecordTracking([
      makeDraftExercise({
        exerciseId: 'ex-bench',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 65, reps: 10 }],
      }),
    ], true)
    expect(readIntentFeedback()).toHaveLength(1)
  })

  it('セッション非アクティブ時の draft クリアは取り消しとみなさず、追跡だけ解除する', () => {
    trackRoutedRecord({
      text: 'ベンチ60kg10回',
      exerciseId: 'ex-bench',
      exerciseName: 'ベンチプレス',
      sets: [{ weight: 60, reps: 10 }],
    })
    // セッション終了（保存して draft をクリア）相当の同期
    syncRoutedRecordTracking([], false)
    expect(readIntentFeedback()).toEqual([])
    // 追跡が解除されているため、その後の同期でも記録されない
    syncRoutedRecordTracking([], true)
    expect(readIntentFeedback()).toEqual([])
  })

  it('reset で追跡が解除される', () => {
    trackRoutedRecord({
      text: 'ベンチ60kg10回',
      exerciseId: 'ex-bench',
      exerciseName: 'ベンチプレス',
      sets: [{ weight: 60, reps: 10 }],
    })
    resetRoutedRecordTracking()
    syncRoutedRecordTracking([], true)
    expect(readIntentFeedback()).toEqual([])
  })
})

describe('routed record tracking の永続化（リロードを跨いだ追跡）', () => {
  // ページリロード相当: モジュール状態を破棄し、localStorage だけが残った
  // 状態で feedbackLog を読み直す
  async function reloadFeedbackLog() {
    vi.resetModules()
    return import('./feedbackLog')
  }

  it('リロード後も、ルーティングで挿入した種目の編集が record-edited として記録される', async () => {
    trackRoutedRecord({
      text: 'ベンチ60kg10回',
      exerciseId: 'ex-bench',
      exerciseName: 'ベンチプレス',
      sets: [{ weight: 60, reps: 10 }],
    })
    const reloaded = await reloadFeedbackLog()
    reloaded.syncRoutedRecordTracking([
      makeDraftExercise({
        exerciseId: 'ex-bench',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 65, reps: 10 }],
      }),
    ], true)
    const entries = readIntentFeedback()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      kind: 'record-edited',
      text: 'ベンチ60kg10回',
      exerciseName: 'ベンチプレス',
    })
  })

  it('リロード後も、ルーティングで挿入した種目の削除が record-removed として記録される', async () => {
    trackRoutedRecord({
      text: 'ベンチ60kg10回',
      exerciseId: 'ex-bench',
      exerciseName: 'ベンチプレス',
      sets: [{ weight: 60, reps: 10 }],
    })
    const reloaded = await reloadFeedbackLog()
    reloaded.syncRoutedRecordTracking([], true)
    const entries = readIntentFeedback()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      kind: 'record-removed',
      text: 'ベンチ60kg10回',
      exerciseName: 'ベンチプレス',
    })
  })

  it('リロード後に変更がなければ何も記録されない', async () => {
    trackRoutedRecord({
      text: 'ベンチ60kg10回',
      exerciseId: 'ex-bench',
      exerciseName: 'ベンチプレス',
      sets: [{ weight: 60, reps: 10 }],
    })
    const reloaded = await reloadFeedbackLog()
    reloaded.syncRoutedRecordTracking([
      makeDraftExercise({
        exerciseId: 'ex-bench',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 60, reps: 10 }],
      }),
    ], true)
    expect(readIntentFeedback()).toEqual([])
  })

  it('永続化された追跡データが壊れていても、同期で例外にならず記録もされない', async () => {
    localStorage.setItem('gymini:intent-feedback-tracked', '{broken json')
    const reloaded = await reloadFeedbackLog()
    expect(() =>
      reloaded.syncRoutedRecordTracking([
        makeDraftExercise({
          exerciseId: 'ex-bench',
          exerciseName: 'ベンチプレス',
          sets: [{ weight: 65, reps: 10 }],
        }),
      ], true),
    ).not.toThrow()
    expect(readIntentFeedback()).toEqual([])
  })
})
