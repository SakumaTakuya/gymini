import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { SignIn } from '@phosphor-icons/react'
import { useWorkoutSession } from '@/hooks/useWorkoutSession'
import { useChatService } from '@/hooks/useChatService'
import { useSettingsStore } from '@/stores/settingsStore'
import { ChatBubble } from '../chat/ChatBubble'
import { ChatInput } from '../chat/ChatInput'
import type { DraftExercise } from '../../schemas/workout'
import type { ChatMessage } from '../../types/chat'
import { ExerciseCard } from './ExerciseCard'

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
  const { messages, isLoading, sendMessage, stopResponse, error } =
    useChatService()
  const hasApiKey = useSettingsStore((s) => s.hasApiKey)

  // ChatInput 内の useMemo([exerciseSearch, trimmed]) を毎レンダ無効化しないよう
  // 同一参照を維持する。中身の関数群は zustand store / useExercises 由来で安定。
  const exerciseSearch = useMemo(
    () => ({
      search: searchExercises,
      onSelect: addExercise,
      create: createExercise,
    }),
    [searchExercises, addExercise, createExercise],
  )

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

  return (
    <div className="flex-1 bg-gym-zinc-50 pb-content-bottom-scroll overflow-y-auto">
      {!hasApiKey && (
        <div className="mx-4 my-4 rounded-2xl bg-gym-white border border-gym-zinc-200 shadow-soft p-4 text-sm">
          <p className="font-semibold mb-2">APIキーが必要です</p>
          <p className="text-gym-zinc-600 mb-3">
            Gemini APIキーを設定するとチャットが利用できます。
          </p>
          <Link
            to="/settings"
            className="focus-ring inline-flex items-center gap-1.5 h-11 px-4 rounded-xl bg-gym-black text-gym-white font-semibold"
          >
            <SignIn size={16} weight="bold" />
            設定画面へ
          </Link>
        </div>
      )}
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
            className={isRecording ? 'sticky top-14 z-10' : undefined}
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

      {error && (
        <div className="mx-4 my-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ChatInput
        isLoading={isLoading}
        onSend={(text) => void sendMessage(text)}
        onStop={stopResponse}
        exerciseSearch={exerciseSearch}
        placeholder="メッセージ or 種目名"
      />
    </div>
  )
}
