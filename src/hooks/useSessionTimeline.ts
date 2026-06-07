import { useMemo } from 'react'
import type { ChatMessage } from '../types/chat'
import type { DraftExercise } from '../schemas/workout'
import type { ISODateTimeString } from '../schemas/date'

export type TimelineItem =
  | { kind: 'message'; data: ChatMessage; timestamp: ISODateTimeString }
  | {
      kind: 'draft'
      data: DraftExercise
      index: number
      timestamp: ISODateTimeString
    }
export type TimelineMessage = Extract<TimelineItem, { kind: 'message' }>
export type TimelineDraft = Extract<TimelineItem, { kind: 'draft' }>

export type SessionTimeline = {
  preamble: TimelineMessage[]
  sections: Array<{ draft: TimelineDraft; messages: TimelineMessage[] }>
}

// Merges chat messages and draft exercises into a sticky-friendly layout:
// each draft card opens a section that owns all chat bubbles emitted after it,
// so the card stays sticky inside its own section. Messages emitted before the
// first card become a preamble that renders above any section.
export function useSessionTimeline(
  messages: ChatMessage[],
  draftExercises: DraftExercise[],
): SessionTimeline {
  return useMemo(() => {
    const items: TimelineItem[] = [
      ...messages.map(
        (m): TimelineMessage => ({
          kind: 'message',
          data: m,
          timestamp: m.timestamp,
        }),
      ),
      ...draftExercises.map(
        (d, i): TimelineDraft => ({
          kind: 'draft',
          data: d,
          index: i,
          timestamp: d.timestamp,
        }),
      ),
    ].sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0,
    )

    const preamble: TimelineMessage[] = []
    const sections: SessionTimeline['sections'] = []
    let current: SessionTimeline['sections'][number] | null = null
    for (const item of items) {
      if (item.kind === 'draft') {
        current = { draft: item, messages: [] }
        sections.push(current)
      } else if (current) {
        current.messages.push(item)
      } else {
        preamble.push(item)
      }
    }
    return { preamble, sections }
  }, [messages, draftExercises])
}
