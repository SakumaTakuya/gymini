import { useMemo } from 'react'
import { useWorkoutSession } from '@/hooks/useWorkoutSession'
import { useChatService } from '@/hooks/useChatService'
import { useRubberBandScroll } from '@/hooks/useRubberBandScroll'
import { buildSessionTimeline } from '@/lib/sessionTimeline'
import type { TimelineDraft } from '@/lib/sessionTimeline'
import { suggestNextSets } from '@/lib/weightSuggestion'
import * as WorkoutRepository from '@/lib/workoutRepository'
import type { WorkoutSet } from '@/schemas/workout'
import { ChatBubble } from '../chat/ChatBubble'
import { ChatInput } from '../chat/ChatInput'
import { ExerciseCard } from './ExerciseCard'
import { ApiKeyMissingBanner } from './ApiKeyMissingBanner'
import { ChatErrorBanner } from './ChatErrorBanner'

export function ActiveSessionView() {
  const {
    draftExercises,
    addExercise,
    activateExercise,
    deleteExercise,
    reorderExercise,
    completeSet,
    editCompletedSet,
    deleteCompletedSet,
    toggleExerciseCard,
    updatePendingSet,
    searchExercises,
    createExercise,
  } = useWorkoutSession()
  const {
    messages,
    isLoading,
    sendMessage,
    stopResponse,
    error,
    lastFailedInput,
    retryLastMessage,
    triggerAction,
  } = useChatService()
  const {
    ref: scrollRef,
    style: rubberBandStyle,
    onPointerDown: rbOnPointerDown,
    onPointerMove: rbOnPointerMove,
    onPointerUp: rbOnPointerUp,
    onPointerCancel: rbOnPointerCancel,
  } = useRubberBandScroll()

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

  // 各種目カードを stacking sticky にするため、「カード + 次のカードまでの ChatMessage」を
  // 1 つの <section> にまとめる。<section> が containing block になることで、sticky なカードは
  // そのセクション内だけで上部固定され、次のセクションが到達した瞬間に押し出される。
  // 最初のカードより前にあるメッセージは preamble として section の外に並べる。
  const { preamble, sections } = useMemo(
    () => buildSessionTimeline(messages, draftExercises),
    [messages, draftExercises],
  )

  // 重量提案: 履歴（永続化済みワークアウト）はセッション中に変化しないため、
  // 初回レンダーで一度だけ読み、セッション中の種目 ID ごとに算出しておく。
  const pastWorkouts = useMemo(() => WorkoutRepository.listByDateDesc(), [])
  const suggestionsByExercise = useMemo(() => {
    const map = new Map<string, WorkoutSet[]>()
    for (const d of draftExercises) {
      if (!map.has(d.exerciseId)) {
        map.set(d.exerciseId, suggestNextSets(pastWorkouts, d.exerciseId))
      }
    }
    return map
  }, [draftExercises, pastWorkouts])

  const renderDraft = (draft: TimelineDraft['data'], i: number) => (
    <ExerciseCard
      draftExercise={draft}
      suggestions={suggestionsByExercise.get(draft.exerciseId)}
      setHandlers={{
        activate: () => activateExercise(i),
        complete: (set) => completeSet(i, set),
        edit: (setIndex) => editCompletedSet(i, setIndex),
        remove: (setIndex) => deleteCompletedSet(i, setIndex),
        changeWeight: (weight) => updatePendingSet(i, { weight }),
        changeReps: (reps) => updatePendingSet(i, { reps }),
      }}
      exerciseHandlers={{
        remove: () => deleteExercise(i),
        moveUp: i > 0 ? () => reorderExercise(i, 'up') : undefined,
        moveDown:
          i < draftExercises.length - 1
            ? () => reorderExercise(i, 'down')
            : undefined,
        toggle: () => toggleExerciseCard(i),
      }}
    />
  )

  return (
    <>
    <div
      data-testid="active-session-scroll"
      ref={scrollRef}
      style={{ viewTransitionName: 'session-frame', ...rubberBandStyle }}
      onPointerDown={rbOnPointerDown}
      onPointerMove={rbOnPointerMove}
      onPointerUp={rbOnPointerUp}
      onPointerCancel={rbOnPointerCancel}
      className="flex-1 bg-gym-paper pb-content-bottom-scroll overflow-y-auto overscroll-contain"
    >
      {/* ヘッダクリアランスは padding ではなくスペーサーで確保する。
          WebKit (iOS の全ブラウザ) はスクロールコンテナ自身の padding-top を
          sticky の top オフセットに加算するため、pt-content-top +
          sticky top-content-top の併用ではカードが content-top の 2 倍の
          位置に固定されてしまう（docs/adr/workout.md 参照）。 */}
      <div aria-hidden="true" className="h-content-top shrink-0" />
      <ApiKeyMissingBanner />
      {preamble.map((item) => (
        <ChatBubble
          key={item.data.id}
          role={item.data.role}
          content={item.data.content}
          actions={item.data.actions}
          consumedActionId={item.data.consumedActionId}
          onActionClick={(action) =>
            void triggerAction(item.data.id, action)
          }
        />
      ))}
      {sections.map((section) => {
        const { data: draft, index: i } = section.draft
        return (
          <section key={`${draft.exerciseId}-${i}`}>
            <div className="sticky top-content-top z-10">{renderDraft(draft, i)}</div>
            {section.messages.map((m) => (
              <ChatBubble
                key={m.data.id}
                role={m.data.role}
                content={m.data.content}
                actions={m.data.actions}
                consumedActionId={m.data.consumedActionId}
                onActionClick={(action) =>
                  void triggerAction(m.data.id, action)
                }
              />
            ))}
          </section>
        )
      })}

      {error && (
        <ChatErrorBanner
          error={error}
          lastFailedInput={lastFailedInput}
          isLoading={isLoading}
          onRetry={() => void retryLastMessage()}
        />
      )}

    </div>
    <ChatInput
      isLoading={isLoading}
      onSend={(text) => void sendMessage(text)}
      onStop={stopResponse}
      exerciseSearch={exerciseSearch}
      placeholder="メッセージ or 種目名"
    />
    </>
  )
}
