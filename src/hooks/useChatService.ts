import { useCallback, useEffect, useRef } from 'react'
import {
  isAbortError,
  messagesToContents,
  nonEmptyOr,
  EMPTY_RESPONSE_FALLBACK,
} from '../lib/chat/conversation'
import {
  buildWriteResultMessage,
  toPendingActionData,
} from '../lib/chat/pendingAction'
import { runConversationTurn } from '../lib/chat/chatService'
import { buildAssistantMessage } from '../lib/chat/messages'
import {
  createGeminiClient,
  buildSystemInstruction,
  getErrorMessage,
  type GeminiClient,
} from '../lib/geminiClient'
import { executeReadTool, executeWriteTool } from '../lib/toolExecutor'
import { buildActiveSessionContext } from '../lib/sessionContext'
import { useChatStore } from '../stores/chatStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUserProfileStore } from '../stores/userProfileStore'
import { useWorkoutSessionStore } from '../stores/workoutSessionStore'
import { onSessionReset } from '../stores/sessionEvents'
import { nowISODateTimeString, todayDateString } from '../schemas/date'
import type { ChatMessage, ProposedAction, ToolCallResult } from '../types/chat'
import {
  INTENT_LABELS,
  type ClassificationResult,
  type IntentClassifier,
  type IntentLabel,
} from '../lib/intent/intentClassifier'
import {
  getReadyIntentClassifier,
  warmUpIntentClassifier,
} from '../lib/intent/intentClassifierProvider'
import {
  extractRecordExercises,
  type ExtractedRecordExercise,
} from '../lib/intent/recordExtractor'
import { buildHistoryResponse } from '../lib/intent/historyResponder'
import { inferExerciseCategory } from '../lib/intent/exerciseCategoryInference'
import {
  buildEditGuidanceMessage,
  findEditTargetExercise,
} from '../lib/intent/editTarget'
import {
  appendIntentFeedback,
  resetRoutedRecordTracking,
  suspendRoutedRecordTracking,
  syncRoutedRecordTracking,
  trackRoutedRecord,
} from '../lib/intent/feedbackLog'
import {
  ADVICE_KEYLESS_MESSAGE,
  EDIT_CHIPS_PROMPT,
  EDIT_NO_DRAFT_MESSAGE,
  INTENT_CHIPS_PROMPT,
  OTHER_KEYLESS_MESSAGE,
  RECORD_NAME_MISSING_MESSAGE,
  buildEditTargetActions,
  buildIntentCandidateActions,
  formatExtractedExerciseLine,
} from '../lib/intent/intentResponses'
import * as ExerciseRepository from '../lib/exerciseRepository'
import * as WorkoutRepository from '../lib/workoutRepository'

type CreateClient = (apiKey: string, systemInstruction?: string) => GeminiClient

export type UseChatServiceOptions = {
  createClient?: CreateClient
  /**
   * ローカル分類器の差し替え（テスト用）。
   * undefined のときは実プロバイダを使い、準備完了時のみ分類する。
   * null のときは分類を無効化し、常に従来経路で処理する。
   */
  classifier?: IntentClassifier | null
}

// record をローカル処理した後に advice を LLM へ回すときの注記。
// 同じ内容を LLM が再記録しないよう systemInstruction へ付ける。
const RECORD_ALREADY_INSERTED_NOTE =
  '## ローカル処理済みの記録について\n直前のユーザー入力の記録は、ローカル処理で既にセッションへ挿入済みです。同じ内容を再度記録せず、アドバイスのみを返してください。'

function isIntentLabel(value: string): value is IntentLabel {
  return (INTENT_LABELS as readonly string[]).includes(value)
}

// other は単独でのみ意味を持つ（意図定義ガイドラインで排他）。
// 他の意図と同時確定した場合は落とす。
function normalizeDecided(decided: IntentLabel[]): IntentLabel[] {
  if (decided.length <= 1) return decided
  return decided.filter((label) => label !== 'other')
}

/**
 * 既に draft にある種目へ、抽出したセットを追加する（FR_004）。
 * セット編集中・新しいセットの入力中のカードには割り込まない
 * （completeSet が入力中の pendingSet を上書きしてしまうため）。
 * マージできたら true を返す。
 * フィードバック追跡は、マージ途中を「ユーザーの修正」と誤記録
 * しないよう一時停止し、最終形でスナップショットを更新する。
 */
function mergeSetsIntoExistingDraft(
  exercise: ExtractedRecordExercise,
  sourceText: string,
): boolean {
  const session = useWorkoutSessionStore.getState()
  const index = session.draftExercises.findIndex(
    (d) => d.exerciseName === exercise.exerciseName,
  )
  if (index < 0) return false
  const draft = session.draftExercises[index]
  if (draft.editingSetIndex != null || draft.pendingSetDirty) return false
  const resume = suspendRoutedRecordTracking()
  try {
    for (const set of exercise.sets) {
      useWorkoutSessionStore.getState().completeSet(index, set)
    }
    const updated = useWorkoutSessionStore
      .getState()
      .draftExercises.find((d) => d.exerciseId === draft.exerciseId)
    if (updated) {
      trackRoutedRecord({
        text: sourceText,
        exerciseId: updated.exerciseId,
        exerciseName: updated.exerciseName,
        sets: updated.sets,
      })
    }
  } finally {
    resume()
  }
  return true
}

type LlmTurnOptions = {
  /** 再送用に lastFailedInput へ保存する元の入力 */
  failedInput: string
  /** ユーザー発話を新規メッセージとして追加するか（チップ経由では追加済み） */
  appendUserMessage: boolean
  /** systemInstruction 末尾への追加指示 */
  extraInstruction?: string
  /**
   * 失敗時に再送対象（lastFailedInput）へ登録するか。再送で副作用が
   * 重複するターン（記録の挿入が完了した後の advice 委譲など）では
   * false にして、完了済みのアクションの再適用を防ぐ。
   */
  registerRetryOnFailure?: boolean
}

export function useChatService(options: UseChatServiceOptions = {}) {
  const messages = useChatStore((s) => s.messages)
  const isLoading = useChatStore((s) => s.isLoading)
  const error = useChatStore((s) => s.error)
  const lastFailedInput = useChatStore((s) => s.lastFailedInput)

  const abortControllerRef = useRef<AbortController | null>(null)

  // 送信ターン全体（分類の await を含む）の直列化ガード。分類中は
  // runLlmTurn の setLoading(true) がまだ実行されておらず、ガードなしだと
  // 2件目の送信が割り込んで、完了順にメッセージが並んだり
  // 後発処理が先行ターンを中断したりする。
  const turnInFlightRef = useRef(false)
  // 分類の await 中であること。チップ操作の割り込みを禁じるのはこの間だけ
  // （LLM ターン実行中のチップは stopResponse で中断するのが既定の挙動）。
  const classifyingRef = useRef(false)
  // ターンの世代。Stop で進められ、完了待ちの sendMessage は
  // 世代が変わっていたら結果を破棄する（分類は AbortController の
  // 対象外なので、世代でキャンセルを表現する）。
  const turnGenerationRef = useRef(0)
  // turnInFlightRef の所有者（世代値）。Stop でガードが先に解除され
  // 次のターンが始まっても、旧ターンの finally が新しい所有者の
  // ガードを解除しないようにするための照合用。
  const turnOwnerRef = useRef(0)

  // options はデフォルト引数 {} により毎レンダー新しい参照になるため、
  // 依存には options 自体ではなく中身の関数だけを使う。そうしないと
  // createClient → sendMessage → triggerAction が毎レンダー再生成される。
  const injectedCreateClient = options.createClient
  const createClient = useCallback<CreateClient>(
    (apiKey, systemInstruction) =>
      injectedCreateClient
        ? injectedCreateClient(apiKey, systemInstruction)
        : createGeminiClient({
            apiKey,
            systemInstruction,
            model: useSettingsStore.getState().model,
          }),
    [injectedCreateClient],
  )

  const injectedClassifier = options.classifier
  const resolveClassifier = useCallback((): IntentClassifier | null => {
    if (injectedClassifier !== undefined) return injectedClassifier
    // モデルの読み込みはバックグラウンドで進め、完了までは従来経路を使う
    warmUpIntentClassifier()
    return getReadyIntentClassifier()
  }, [injectedClassifier])

  const tryClassify = useCallback(
    async (text: string): Promise<ClassificationResult | null> => {
      const classifier = resolveClassifier()
      if (!classifier) return null
      try {
        return await classifier.classify(text)
      } catch {
        // 分類に失敗したら従来経路へフォールバックする（FR_006）
        return null
      }
    },
    [resolveClassifier],
  )

  // FR_007: ルーティングで挿入した記録の取り消し・修正を検出して記録する
  useEffect(() => {
    const unsubscribe = useWorkoutSessionStore.subscribe((state) => {
      syncRoutedRecordTracking(state.draftExercises, state.isActive)
    })
    const offReset = onSessionReset(() => {
      resetRoutedRecordTracking()
    })
    return () => {
      unsubscribe()
      offReset()
    }
  }, [])

  const clearMessages = useCallback(() => {
    useChatStore.getState().clearMessages()
  }, [])

  const stopResponse = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    // 分類の完了待ちのターンもキャンセルする: 世代を進めて
    // sendMessage 側に結果を破棄させる。分類中はガードも即時解除し、
    // 次の送信を受け付けられるようにする（LLM 実行中のターンは
    // 所有者の finally が解除する）。
    turnGenerationRef.current += 1
    if (classifyingRef.current) {
      classifyingRef.current = false
      turnInFlightRef.current = false
    }
    useChatStore.getState().setLoading(false)
  }, [])

  const addUserMessage = useCallback((text: string): void => {
    useChatStore.getState().addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: nowISODateTimeString(),
    })
  }, [])

  // 従来の LLM 経路（1 ターン分）。ユーザー発話の追加は appendUserMessage で制御する。
  const runLlmTurn = useCallback(
    async (turn: LlmTurnOptions) => {
      const settings = useSettingsStore.getState()
      const { profile } = useUserProfileStore.getState()

      abortControllerRef.current?.abort()
      const ctrl = new AbortController()
      abortControllerRef.current = ctrl

      const chat = useChatStore.getState()
      chat.setError(null)
      chat.setLastFailedInput(null)
      let userMessageId: string | null = null
      if (turn.appendUserMessage) {
        userMessageId = crypto.randomUUID()
        chat.addMessage({
          id: userMessageId,
          role: 'user',
          content: turn.failedInput,
          timestamp: nowISODateTimeString(),
        })
      }
      chat.setLoading(true)

      try {
        const sessionContext = buildActiveSessionContext()
        const baseInstruction = buildSystemInstruction(profile, sessionContext)
        const systemInstruction = turn.extraInstruction
          ? `${baseInstruction}\n\n${turn.extraInstruction}`
          : baseInstruction
        const client = createClient(settings.apiKey, systemInstruction)
        let baseContents = messagesToContents(useChatStore.getState().messages)
        // Gemini は user/model の交互列を要求する。チップ経由などで
        // 履歴が model で終わる場合は元の入力を user ターンとして補う。
        const lastContent = baseContents[baseContents.length - 1]
        if (baseContents.length === 0 || lastContent.role === 'model') {
          baseContents = [
            ...baseContents,
            { role: 'user', parts: [{ text: turn.failedInput }] },
          ]
        } else if (!turn.appendUserMessage) {
          // 中断された別ターンの user 発話が末尾に残っている場合がある
          // （応答待ちの間にチップがタップされた等）。交互列を保つため
          // 追加はできないので、このターンの入力と異なるときは
          // 末尾の user ターンを置き換える。
          const lastText = lastContent.parts
            .map((p) =>
              'text' in p && typeof p.text === 'string' ? p.text : '',
            )
            .join('')
          if (lastText !== turn.failedInput) {
            baseContents = [
              ...baseContents.slice(0, -1),
              { role: 'user', parts: [{ text: turn.failedInput }] },
            ]
          }
        }

        const outcome = await runConversationTurn({
          baseContents,
          client,
          executeRead: executeReadTool,
          signal: ctrl.signal,
        })

        switch (outcome.kind) {
          case 'text': {
            useChatStore
              .getState()
              .addMessage(
                buildAssistantMessage(
                  nonEmptyOr(outcome.text, EMPTY_RESPONSE_FALLBACK),
                  outcome.toolCalls,
                ),
              )
            return
          }
          case 'write': {
            const data = toPendingActionData(outcome.call)
            if (!data) {
              useChatStore
                .getState()
                .setError('書き込み操作の内容を解釈できませんでした。')
              return
            }
            const result = executeWriteTool(
              outcome.call.name,
              outcome.call.args,
            )
            useChatStore.getState().addMessage(
              buildAssistantMessage(
                nonEmptyOr(
                  outcome.assistantText,
                  buildWriteResultMessage(data, result),
                ),
                [
                  ...outcome.precedingReads,
                  {
                    toolName: outcome.call.name,
                    args: outcome.call.args,
                    result,
                  },
                ],
              ),
            )
            return
          }
          case 'proposal': {
            useChatStore.getState().addMessage(
              outcome.precedingReads
                ? { ...outcome.proposalMsg, toolCalls: outcome.precedingReads }
                : outcome.proposalMsg,
            )
            return
          }
          default: {
            // 将来 TurnOutcome に variant を追加したとき TS でハンドラ漏れを検出する
            const _exhaustive: never = outcome
            throw new Error(
              `Unhandled TurnOutcome kind: ${JSON.stringify(_exhaustive)}`,
            )
          }
        }
      } catch (err) {
        if (isAbortError(err)) return
        console.error('[ai-chat] Gemini API error:', err)
        const store = useChatStore.getState()
        if (userMessageId) store.removeMessage(userMessageId)
        if (turn.registerRetryOnFailure !== false) {
          store.setLastFailedInput(turn.failedInput)
        }
        store.setError(getErrorMessage(err))
      } finally {
        // この turn がまだ「現行のリクエスト」である場合のみ loading を畳む。
        // 新しい sendMessage に置き換えられた turn（abort された旧 turn）が
        // 無条件に setLoading(false) すると、進行中の新 turn のスピナーを
        // 消してしまう。stopResponse 経由の中断はそちらで false 済み。
        if (abortControllerRef.current === ctrl) {
          abortControllerRef.current = null
          useChatStore.getState().setLoading(false)
        }
      }
    },
    [createClient],
  )

  // ローカル分類で確定した意図を端末内で処理する（FR_003〜FR_005）。
  // ユーザー発話は呼び出し側で追加済みの前提。
  const routeLocally = useCallback(
    async (text: string, intents: IntentLabel[]) => {
      // 進行中の LLM ターンがある場合は中断してから処理する。放置すると
      // 後から届いた無関係な応答がローカル処理の結果の後に混入する。
      stopResponse()
      const hasApiKey = useSettingsStore.getState().hasApiKey
      const parts: string[] = []
      const toolCalls: ToolCallResult[] = []
      let editChipsMessage: ChatMessage | null = null
      let insertedAnyRecord = false

      if (intents.includes('record')) {
        const knownNames = ExerciseRepository.getAll().map((e) => e.name)
        const extracted = extractRecordExercises(text, knownNames)
        if (extracted.length === 0) {
          if (hasApiKey) {
            // ルールで抽出できない場合のみ LLM へ抽出を委譲する（§6 決定 C）
            await runLlmTurn({ failedInput: text, appendUserMessage: false })
            return
          }
          parts.push(RECORD_NAME_MISSING_MESSAGE)
        } else {
          const lines: string[] = []
          let sessionGateMessage: string | null = null
          for (const exercise of extracted) {
            const args: Record<string, unknown> = {
              exerciseName: exercise.exerciseName,
              sets: exercise.sets,
            }
            // マスター未登録の新規種目は、部位で絞る履歴検索から漏れない
            // よう、種目名から推定したカテゴリを付ける（既存種目には
            // 付けない。LLM 経路の system 指示と同じ運用）。
            if (!knownNames.includes(exercise.exerciseName)) {
              const category = inferExerciseCategory(exercise.exerciseName)
              if (category !== undefined) args.category = category
            }
            const result = executeWriteTool('addExerciseToSession', args)
            toolCalls.push({
              toolName: 'addExerciseToSession',
              args,
              result,
            })
            if (!result.success) {
              if (result.error === 'SESSION_NOT_ACTIVE') {
                // 既存のゲート（ai-chat FR_036）の案内文をそのまま使う
                sessionGateMessage = buildWriteResultMessage(
                  {
                    actionType: 'addExerciseToSession',
                    exerciseName: exercise.exerciseName,
                  },
                  result,
                )
                break
              }
              if (
                result.error === 'EXERCISE_ALREADY_IN_SESSION' &&
                exercise.sets.length > 0 &&
                mergeSetsIntoExistingDraft(exercise, text)
              ) {
                // 既存カードへセットをマージできた場合は記録として扱う
                insertedAnyRecord = true
                lines.push(`・${formatExtractedExerciseLine(exercise)}`)
                continue
              }
              lines.push(
                result.error === 'EXERCISE_ALREADY_IN_SESSION'
                  ? `・${exercise.exerciseName}: 既にセッションに追加されています`
                  : `・${exercise.exerciseName}: 記録できませんでした`,
              )
              continue
            }
            insertedAnyRecord = true
            if (
              exercise.sets.length === 0 &&
              exercise.mentionedWeight !== undefined
            ) {
              // 完了セットが無く重量だけが言及された場合（「ベンチプレス
              // 60kg」）、確認文には重量を出す一方で下書きの入力中セットは
              // 既定の 0kg のままになり値が落ちてしまうため、言及された
              // 重量を pendingSet へ引き継ぐ。
              const session = useWorkoutSessionStore.getState()
              const draftIndex = session.draftExercises.findIndex(
                (d) => d.exerciseName === exercise.exerciseName,
              )
              if (draftIndex >= 0) {
                session.updatePendingSet(draftIndex, {
                  weight: exercise.mentionedWeight,
                })
              }
            }
            const exerciseId = (
              result.data as { exerciseId?: string } | undefined
            )?.exerciseId
            if (exerciseId) {
              trackRoutedRecord({
                text,
                exerciseId,
                exerciseName: exercise.exerciseName,
                sets: exercise.sets,
              })
            }
            lines.push(`・${formatExtractedExerciseLine(exercise)}`)
          }
          if (sessionGateMessage) {
            parts.push(sessionGateMessage)
          } else if (insertedAnyRecord) {
            parts.push(['記録しました！', ...lines].join('\n'))
          } else {
            parts.push(lines.join('\n'))
          }
        }
      }

      if (intents.includes('history')) {
        const allExercises = ExerciseRepository.getAll()
        parts.push(
          buildHistoryResponse(
            text,
            WorkoutRepository.listByDateDesc(),
            allExercises.map((e) => e.name),
            todayDateString(),
            new Map(allExercises.map((e) => [e.id, e.category])),
          ),
        )
      }

      if (intents.includes('edit')) {
        const drafts = useWorkoutSessionStore.getState().draftExercises
        const target = findEditTargetExercise(text, drafts)
        if (target) {
          parts.push(buildEditGuidanceMessage(target.exerciseName))
        } else if (drafts.length > 0) {
          // 対象を特定できない場合は候補チップで確認する（FR_005）
          editChipsMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: EDIT_CHIPS_PROMPT,
            timestamp: nowISODateTimeString(),
            actions: buildEditTargetActions(drafts),
          }
        } else {
          parts.push(EDIT_NO_DRAFT_MESSAGE)
        }
      }

      let needsAdviceTurn = false
      if (intents.includes('advice')) {
        if (hasApiKey) {
          needsAdviceTurn = true
        } else {
          parts.push(ADVICE_KEYLESS_MESSAGE)
        }
      }

      if (intents.includes('other') && intents.length === 1) {
        if (hasApiKey) {
          // チップで「その他」が選ばれた場合などは LLM の受け皿へ回す
          await runLlmTurn({ failedInput: text, appendUserMessage: false })
          return
        }
        parts.push(OTHER_KEYLESS_MESSAGE)
      }

      if (parts.length > 0) {
        useChatStore
          .getState()
          .addMessage(
            buildAssistantMessage(
              parts.join('\n\n'),
              toolCalls.length > 0 ? toolCalls : undefined,
            ),
          )
      }
      if (editChipsMessage) {
        useChatStore.getState().addMessage(editChipsMessage)
      }
      if (needsAdviceTurn) {
        await runLlmTurn({
          failedInput: text,
          appendUserMessage: false,
          extraInstruction: insertedAnyRecord
            ? RECORD_ALREADY_INSERTED_NOTE
            : undefined,
          // 記録の挿入が完了しているターンを再送すると、分類から
          // やり直して同じセットがマージで重複する。再送は登録しない
          registerRetryOnFailure: !insertedAnyRecord,
        })
      }
    },
    [runLlmTurn, stopResponse],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (trimmed === '') return
      // 送信ターンは分類の完了待ちも含めて1つだけに直列化する
      if (turnInFlightRef.current) return
      const generation = ++turnGenerationRef.current
      turnOwnerRef.current = generation
      turnInFlightRef.current = true
      // 分類中も busy とマークし、入力側が二重送信を受け付けないようにする
      useChatStore.getState().setLoading(true)
      try {
        const settings = useSettingsStore.getState()

        // ローカル分類（FR_001/FR_002）。準備ができていない・失敗した場合は
        // 従来経路へフォールバックする（FR_006）。
        classifyingRef.current = true
        let classification: ClassificationResult | null
        try {
          classification = await tryClassify(trimmed)
        } finally {
          if (turnOwnerRef.current === generation) {
            classifyingRef.current = false
          }
        }
        // 分類の完了待ちの間に Stop されたら、このターンは破棄する
        if (generation !== turnGenerationRef.current) return
        // 前回失敗した入力の再送相当で、失敗したターンのユーザー発話が
        // チャットに残っている場合は追加し直さない（バブルと Gemini 履歴の
        // 二重化防止）。発話が残るのはローカルルーティングから LLM へ
        // 委譲したターンで、通常の LLM ターンは失敗時に発話を取り除く
        // ため、その場合は従来どおり追加する。
        const chatBefore = useChatStore.getState()
        const lastUserMessage = [...chatBefore.messages]
          .reverse()
          .find((m) => m.role === 'user')
        const reuseUserMessage =
          chatBefore.lastFailedInput === trimmed &&
          lastUserMessage?.content === trimmed
        if (classification) {
          appendIntentFeedback({
            kind: 'classified',
            text: trimmed,
            scores: classification.scores,
            decided: classification.decided,
            candidates: classification.candidates,
          })

          if (classification.decided.length === 0) {
            // どの意図も閾値に達しない場合は推測で処理せず候補チップで選ばせる
            const chat = useChatStore.getState()
            chat.setError(null)
            chat.setLastFailedInput(null)
            if (!reuseUserMessage) addUserMessage(trimmed)
            chat.addMessage({
              id: crypto.randomUUID(),
              role: 'assistant',
              content: INTENT_CHIPS_PROMPT,
              timestamp: nowISODateTimeString(),
              actions: buildIntentCandidateActions(
                classification.candidates,
                trimmed,
              ),
            })
            chat.setLoading(false)
            return
          }

          const intents = normalizeDecided(classification.decided)
          const llmOnly =
            intents.length > 0 &&
            intents.every((label) => label === 'advice' || label === 'other')
          if (!(llmOnly && settings.hasApiKey)) {
            const chat = useChatStore.getState()
            chat.setError(null)
            chat.setLastFailedInput(null)
            if (!reuseUserMessage) addUserMessage(trimmed)
            // ローカル処理の冒頭（stopResponse）で loading は解除される
            await routeLocally(trimmed, intents)
            return
          }
          // advice / other のみ + キーありは従来の LLM 経路へフォールスルーする
        }

        if (!settings.hasApiKey) {
          const store = useChatStore.getState()
          store.setError(
            'AIチャットを利用するにはAPIキーの設定が必要です。設定画面からGemini APIキーを入力してください。',
          )
          store.setLastFailedInput(trimmed)
          store.setLoading(false)
          return
        }

        // 再送時は元のユーザー発話が残っているため、分類に失敗して
        // この経路へ落ちた場合も発話を追加し直さない
        await runLlmTurn({
          failedInput: trimmed,
          appendUserMessage: !reuseUserMessage,
        })
      } finally {
        if (turnOwnerRef.current === generation) {
          turnInFlightRef.current = false
        }
      }
    },
    [addUserMessage, routeLocally, runLlmTurn, tryClassify],
  )

  const retryLastMessage = useCallback(async () => {
    const { lastFailedInput: input, isLoading: loading } =
      useChatStore.getState()
    if (!input || loading) return
    await sendMessage(input)
  }, [sendMessage])

  const triggerAction = useCallback(
    async (messageId: string, action: ProposedAction) => {
      const chatState = useChatStore.getState()
      const target = chatState.messages.find((m) => m.id === messageId)
      if (!target) return
      if (target.consumedActionId) return
      // 分類の完了待ちの間はチップによる割り込みを受け付けない（直列化）。
      // 消費もしないので、ターン完了後に改めてタップできる。
      // LLM ターン実行中は対象外（stopResponse で中断する既定の挙動）。
      if (
        (action.kind === 'intent-route' || action.kind === 'edit-target') &&
        classifyingRef.current
      ) {
        return
      }
      // ask-followup は sendMessage 経由のため、ターン処理中は
      // 消費せずに弾く（消費してから送信が弾かれると黙って消える）。
      if (action.kind === 'ask-followup' && turnInFlightRef.current) {
        return
      }

      chatState.consumeAction(messageId, action.id)

      switch (action.kind) {
        case 'intent-route': {
          // 候補チップで選ばれた意図で元の入力を再ルーティングする（FR_002）
          const intent = action.payload?.intent
          const originalText = action.payload?.text
          if (!intent || !originalText || !isIntentLabel(intent)) return
          appendIntentFeedback({
            kind: 'chip-choice',
            text: originalText,
            chosenIntent: intent,
          })
          const owner = ++turnGenerationRef.current
          turnOwnerRef.current = owner
          turnInFlightRef.current = true
          try {
            await routeLocally(originalText, [intent])
          } finally {
            if (turnOwnerRef.current === owner) {
              turnInFlightRef.current = false
            }
          }
          return
        }
        case 'edit-target': {
          // edit の対象選択チップ: 対象カードへの誘導文を返す（FR_005）
          const exerciseName = action.payload?.exerciseName
          if (!exerciseName) return
          stopResponse()
          useChatStore
            .getState()
            .addMessage(
              buildAssistantMessage(buildEditGuidanceMessage(exerciseName)),
            )
          return
        }
        case 'start-exercise': {
          const exerciseName = action.payload?.exerciseName
          if (!exerciseName) return
          // 既存種目名 → id の解決は executeAddExerciseToSession 側で行う
          // （直接 write 経路と提案経路で同じ解決を共有するため）。
          const args: Record<string, unknown> = {
            exerciseName,
            sets: [{ weight: 0, reps: 0 }],
          }
          if (action.payload?.exerciseId) {
            args.exerciseId = action.payload.exerciseId
          }
          const result = executeWriteTool('addExerciseToSession', args)
          const data = toPendingActionData({
            name: 'addExerciseToSession',
            args,
          })
          useChatStore.getState().addMessage(
            buildAssistantMessage(
              data
                ? buildWriteResultMessage(data, result)
                : '提案を実行できませんでした。',
              [{ toolName: 'addExerciseToSession', args, result }],
            ),
          )
          return
        }
        case 'show-history': {
          const exerciseName = action.payload?.exerciseName
          if (!exerciseName) return
          const args = { exerciseName }
          const result = executeReadTool('getWorkoutsByExercise', args)
          const content = formatHistoryResultMessage(exerciseName, result)
          useChatStore.getState().addMessage(
            buildAssistantMessage(content, [
              { toolName: 'getWorkoutsByExercise', args, result },
            ]),
          )
          return
        }
        case 'ask-followup': {
          const prompt = action.payload?.prompt ?? action.label
          await sendMessage(prompt)
          return
        }
      }
    },
    [routeLocally, sendMessage, stopResponse],
  )

  return {
    messages,
    isLoading,
    error,
    lastFailedInput,
    sendMessage,
    stopResponse,
    clearMessages,
    retryLastMessage,
    triggerAction,
  }
}

function formatHistoryResultMessage(
  exerciseName: string,
  result: unknown,
): string {
  if (
    result &&
    typeof result === 'object' &&
    'success' in result &&
    (result as { success?: unknown }).success === false
  ) {
    return `${exerciseName} の履歴を取得できませんでした。`
  }
  const records = Array.isArray(result)
    ? result
    : Array.isArray((result as { workouts?: unknown[] } | undefined)?.workouts)
      ? (result as { workouts: unknown[] }).workouts
      : []
  if (records.length === 0) {
    return `${exerciseName} の履歴はまだありません。`
  }
  return `${exerciseName} の直近の記録 ${records.length} 件を表示します。`
}
