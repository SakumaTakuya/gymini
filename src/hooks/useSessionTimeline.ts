import { useMemo } from 'react'
import type { ChatMessage } from '../types/chat'
import type { DraftExercise } from '../schemas/workout'

export type TimelineItem =
  | { kind: 'message'; data: ChatMessage; timestamp: string }
  | { kind: 'draft'; data: DraftExercise; index: number; timestamp: string }
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
  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...messages.map((m) => ({
        kind: 'message' as const,
        data: m,
        timestamp: m.timestamp,
      })),
      ...draftExercises.map((d, i) => ({
        kind: 'draft' as const,
        data: d,
        index: i,
        timestamp: d.timestamp,
      })),
    ]
    return items.sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0,
    )
  }, [messages, draftExercises])

  return useMemo(() => {
    const preamble: TimelineMessage[] = []
    const sections: SessionTimeline['sections'] = []
    let current: SessionTimeline['sections'][number] | null = null
    for (const item of timelineItems) {
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
  }, [timelineItems])
}
