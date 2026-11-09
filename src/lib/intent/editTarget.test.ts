import { describe, it, expect } from 'vitest'
import {
  findEditTargetExercise,
  buildEditGuidanceMessage,
} from './editTarget'
import { makeDraftExercise } from '../../test/fixtures/draftExercise'

const drafts = [
  makeDraftExercise({ exerciseId: 'ex-bench', exerciseName: 'ベンチプレス' }),
  makeDraftExercise({ exerciseId: 'ex-squat', exerciseName: 'スクワット' }),
]

describe('findEditTargetExercise', () => {
  it('文中の種目名で対象を特定する', () => {
    const target = findEditTargetExercise('さっきのベンチ70kgの間違い', drafts)
    expect(target?.exerciseId).toBe('ex-bench')
  })

  it('「最後の」で末尾の種目を特定する', () => {
    const target = findEditTargetExercise('最後のセット消して', drafts)
    expect(target?.exerciseId).toBe('ex-squat')
  })

  it('「さっきの」だけでも末尾の種目を特定する', () => {
    const target = findEditTargetExercise('さっきの記録70kgの間違い', drafts)
    expect(target?.exerciseId).toBe('ex-squat')
  })

  it('特定できない場合は null を返す', () => {
    expect(findEditTargetExercise('記録を直して', drafts)).toBeNull()
  })

  it('draft が空なら null を返す', () => {
    expect(findEditTargetExercise('最後の消して', [])).toBeNull()
  })
})

describe('buildEditGuidanceMessage', () => {
  it('対象カードへの誘導文を返す', () => {
    const msg = buildEditGuidanceMessage('ベンチプレス')
    expect(msg).toContain('ベンチプレス')
    expect(msg).toContain('カード')
  })
})
