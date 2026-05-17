import { describe, expect, test } from 'vitest'
import {
  partitionFunctionCalls,
  toProposalMessage,
} from './pendingAction'
import type { FunctionCallRequest } from '../geminiClient'

describe('partitionFunctionCalls', () => {
  test('read / write / propose の 3 値を返す', () => {
    const calls: FunctionCallRequest[] = [
      { name: 'getRecentWorkouts', args: { count: 5 } },
      { name: 'addExerciseToSession', args: { exerciseName: 'ベンチ' } },
      {
        name: 'proposeAction',
        args: { rationale: 'どれにする?', options: [] },
      },
    ]
    const { readCalls, writeCall, proposeCall } = partitionFunctionCalls(calls)
    expect(readCalls).toHaveLength(1)
    expect(readCalls[0].name).toBe('getRecentWorkouts')
    expect(writeCall?.name).toBe('addExerciseToSession')
    expect(proposeCall?.name).toBe('proposeAction')
  })

  test('write が複数返ったら最初の 1 件のみ採用、残りは無視', () => {
    const calls: FunctionCallRequest[] = [
      { name: 'addExerciseToSession', args: { exerciseName: 'A' } },
      { name: 'saveWorkout', args: { date: '2026-05-17', exercises: [] } },
    ]
    const { writeCall } = partitionFunctionCalls(calls)
    expect(writeCall?.name).toBe('addExerciseToSession')
  })

  test('propose が複数返ったら最初の 1 件のみ採用', () => {
    const calls: FunctionCallRequest[] = [
      { name: 'proposeAction', args: { rationale: 'A', options: [] } },
      { name: 'proposeAction', args: { rationale: 'B', options: [] } },
    ]
    const { proposeCall } = partitionFunctionCalls(calls)
    expect(
      (proposeCall?.args as { rationale?: string } | undefined)?.rationale,
    ).toBe('A')
  })

  test('write/propose が無い場合は null', () => {
    const calls: FunctionCallRequest[] = [
      { name: 'getExercises', args: {} },
    ]
    const { readCalls, writeCall, proposeCall } = partitionFunctionCalls(calls)
    expect(readCalls).toHaveLength(1)
    expect(writeCall).toBeNull()
    expect(proposeCall).toBeNull()
  })
})

describe('toProposalMessage', () => {
  test('正常系: rationale と options を ChatMessage に変換', () => {
    const call: FunctionCallRequest = {
      name: 'proposeAction',
      args: {
        rationale: '胸の日ですね。候補:',
        options: [
          {
            id: 'opt1',
            label: 'ベンチプレスを始める',
            kind: 'start-exercise',
            payload: { exerciseName: 'ベンチプレス' },
          },
          {
            id: 'opt2',
            label: '前回履歴を見る',
            kind: 'show-history',
            payload: { exerciseName: 'ベンチプレス' },
          },
        ],
      },
    }
    const msg = toProposalMessage(call)
    expect(msg).not.toBeNull()
    expect(msg?.role).toBe('assistant')
    expect(msg?.content).toBe('胸の日ですね。候補:')
    expect(msg?.actions).toHaveLength(2)
    expect(msg?.actions?.[0].id).toBe('opt1')
    expect(msg?.actions?.[0].kind).toBe('start-exercise')
    expect(msg?.actions?.[1].kind).toBe('show-history')
  })

  test('options が 0 個なら null', () => {
    const call: FunctionCallRequest = {
      name: 'proposeAction',
      args: { rationale: 'ない', options: [] },
    }
    expect(toProposalMessage(call)).toBeNull()
  })

  test('rationale が文字列でないなら null', () => {
    const call: FunctionCallRequest = {
      name: 'proposeAction',
      args: { rationale: 123, options: [{ id: 'a', label: 'A', kind: 'start-exercise' }] },
    }
    expect(toProposalMessage(call)).toBeNull()
  })

  test('未知の kind は除外し、有効な kind だけ残す', () => {
    const call: FunctionCallRequest = {
      name: 'proposeAction',
      args: {
        rationale: 'r',
        options: [
          { id: 'a', label: 'A', kind: 'start-exercise', payload: { exerciseName: 'X' } },
          { id: 'b', label: 'B', kind: 'unknown-kind' },
        ],
      },
    }
    const msg = toProposalMessage(call)
    expect(msg?.actions).toHaveLength(1)
    expect(msg?.actions?.[0].kind).toBe('start-exercise')
  })

  test('有効な options が結果的に 0 個なら null', () => {
    const call: FunctionCallRequest = {
      name: 'proposeAction',
      args: {
        rationale: 'r',
        options: [{ id: 'a', label: 'A', kind: 'bad-kind' }],
      },
    }
    expect(toProposalMessage(call)).toBeNull()
  })

  test('options が 5 個を超える場合は先頭 5 件で切り詰める', () => {
    const call: FunctionCallRequest = {
      name: 'proposeAction',
      args: {
        rationale: 'r',
        options: Array.from({ length: 7 }, (_, i) => ({
          id: `opt${i}`,
          label: `L${i}`,
          kind: 'start-exercise',
          payload: { exerciseName: `E${i}` },
        })),
      },
    }
    const msg = toProposalMessage(call)
    expect(msg?.actions).toHaveLength(5)
    expect(msg?.actions?.[0].id).toBe('opt0')
    expect(msg?.actions?.[4].id).toBe('opt4')
  })

  test('start-exercise / show-history で exerciseName が無い option は除外', () => {
    const call: FunctionCallRequest = {
      name: 'proposeAction',
      args: {
        rationale: 'r',
        options: [
          { id: 'a', label: 'A', kind: 'start-exercise' },
          { id: 'b', label: 'B', kind: 'show-history' },
          { id: 'c', label: 'C', kind: 'ask-followup', payload: { prompt: '重量を指定したい' } },
        ],
      },
    }
    const msg = toProposalMessage(call)
    expect(msg?.actions).toHaveLength(1)
    expect(msg?.actions?.[0].kind).toBe('ask-followup')
  })

  test('proposeAction 以外のツール呼び出しは null', () => {
    const call: FunctionCallRequest = {
      name: 'addExercise',
      args: { name: 'X' },
    }
    expect(toProposalMessage(call)).toBeNull()
  })
})
