import { useMemo } from 'react'
import { useWorkoutSession } from '@/hooks/useWorkoutSession'
import { useChatStore } from '@/stores/chatStore'
import { ChatBubble } from '../chat/ChatBubble'
import type { DraftExercise } from '../../schemas/workout'
import type { ChatMessage } from '../../types/chat'
import { ExerciseCard } from './ExerciseCard'
import { ExerciseSearchField } from './ExerciseSearchField'

type TimelineItem =
  | { kind: 'message'; data: ChatMessage; timestamp: string }
  | {
      kind: 'draft'
      data: DraftExercise
      index: number
      timestamp: string
    }

export function ActiveSessionView() {
  const {
    draftExercises,
    addExercise,
    activateExercise,
    deleteExercise,
    reorderExercise,
    acceptSuggestedExercise,
    completeSet,
    editCompletedSet,
    deleteCompletedSet,
    toggleExerciseCard,
    updatePendingSet,
    searchExercises,
    createExercise,
  } = useWorkoutSession()
  const messages = useChatStore((s) => s.messages)

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
    return items.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }, [messages, draftExercises])

  return (
    <div className="flex-1 bg-gym-zinc-50 pb-content-bottom-scroll overflow-y-auto">
      {timelineItems.map((item) => {
        if (item.kind === 'message') {
          return (
            <ChatBubble
              key={item.data.id}
              role={item.data.role}
              content={item.data.content}
            />
          )
        }
        const { data: draft, index: i } = item
        const isRecording = draft.cardState === 'recording'
        return (
          <div
            key={`${draft.exerciseId}-${i}`}
            className={isRecording ? 'sticky top-14 z-10' : ''}
          >
            <ExerciseCard
              draftExercise={draft}
              onActivate={() => activateExercise(i)}
              onComplete={(set) => completeSet(i, set)}
              onEdit={(setIndex) => editCompletedSet(i, setIndex)}
              onDelete={(setIndex) => deleteCompletedSet(i, setIndex)}
              onDeleteExercise={() => deleteExercise(i)}
              onMoveUp={i > 0 ? () => reorderExercise(i, 'up') : undefined}
              onMoveDown={
                i < draftExercises.length - 1
                  ? () => reorderExercise(i, 'down')
                  : undefined
              }
              onToggle={() => toggleExerciseCard(i)}
              onWeightChange={(weight) => updatePendingSet(i, { weight })}
              onRepsChange={(reps) => updatePendingSet(i, { reps })}
              onAcceptSuggested={(sets) => acceptSuggestedExercise(i, sets)}
              onRejectSuggested={() => deleteExercise(i)}
            />
          </div>
        )
      })}

      <ExerciseSearchField
        onSelectExercise={addExercise}
        searchExercises={searchExercises}
        createExercise={createExercise}
      />
    </div>
  )
}
