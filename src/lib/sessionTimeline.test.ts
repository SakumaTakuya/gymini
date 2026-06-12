import { describe, it, expect } from 'vitest'
import { buildSessionTimeline } from './sessionTimeline'
import type { ChatMessage } from '../types/chat'
import type { DraftExercise } from '../schemas/workout'
import type { ISODateTimeString } from '../schemas/date'

const ts = (s: string) => s as ISODateTimeString

function msg(id: string, timestamp: string): ChatMessage {
  return {
    id,
    role: 'user',
    content: id,
    timestamp: ts(timestamp),
  }
}

function draft(id: string, timestamp: string): DraftExercise {
  return {
    exerciseId: id,
    exerciseName: id,
    sets: [],
    pendingSet: null,
    pendingSetDirty: false,
    cardState: 'idle',
    editingSetIndex: null,
    timestamp: ts(timestamp),
  }
}

describe('buildSessionTimeline', () => {
  it('メッセージのみのとき全て preamble、sections は空', () => {
    const result = buildSessionTimeline(
      [
        msg('m1', '2026-04-18T10:00:00+09:00'),
        msg('m2', '2026-04-18T10:05:00+09:00'),
      ],
      [],
    )
    expect(result.preamble.map((p) => p.data.id)).toEqual(['m1', 'm2'])
    expect(result.sections).toHaveLength(0)
  })

  it('draft があり、それより前のメッセージは preamble、後のメッセージはセクションに入る', () => {
    const result = buildSessionTimeline(
      [
        msg('m-before', '2026-04-18T10:00:00+09:00'),
        msg('m-after', '2026-04-18T10:10:00+09:00'),
      ],
      [draft('d1', '2026-04-18T10:05:00+09:00')],
    )
    expect(result.preamble.map((p) => p.data.id)).toEqual(['m-before'])
    expect(result.sections).toHaveLength(1)
    expect(result.sections[0].draft.data.exerciseId).toBe('d1')
    expect(result.sections[0].messages.map((m) => m.data.id)).toEqual([
      'm-after',
    ])
  })

  it('複数 draft が時系列順にセクション化され、各セクションは次の draft までのメッセージを保持する', () => {
    const result = buildSessionTimeline(
      [
        msg('m1', '2026-04-18T10:06:00+09:00'),
        msg('m2', '2026-04-18T10:11:00+09:00'),
        msg('m3', '2026-04-18T10:16:00+09:00'),
      ],
      [
        draft('d1', '2026-04-18T10:05:00+09:00'),
        draft('d2', '2026-04-18T10:10:00+09:00'),
      ],
    )
    expect(result.preamble).toEqual([])
    expect(result.sections).toHaveLength(2)
    expect(result.sections[0].messages.map((m) => m.data.id)).toEqual(['m1'])
    expect(result.sections[1].messages.map((m) => m.data.id)).toEqual([
      'm2',
      'm3',
    ])
  })

  it('draft の index は draftExercises 配列内の位置を保持する', () => {
    const result = buildSessionTimeline(
      [],
      [
        draft('d0', '2026-04-18T10:00:00+09:00'),
        draft('d1', '2026-04-18T10:05:00+09:00'),
      ],
    )
    expect(result.sections[0].draft.index).toBe(0)
    expect(result.sections[1].draft.index).toBe(1)
  })
})
