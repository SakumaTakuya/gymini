import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkoutSessionStore } from './workoutSessionStore'
import { useChatStore } from './chatStore'
import { makeChatMessage } from '../test/fixtures/chatMessage'
import type { DateString } from '../schemas/date'

// Reset store between tests
function resetStore() {
  useWorkoutSessionStore.setState({
    isActive: false,
    startedAt: null,
    date: null,
    draftExercises: [],
  })
  useChatStore.setState({ messages: [], isLoading: false, error: null })
}

describe('workoutSessionStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
  })

  describe('初期状態', () => {
    it('正しい初期値を持つ', () => {
      const state = useWorkoutSessionStore.getState()
      expect(state.isActive).toBe(false)
      expect(state.startedAt).toBeNull()
      expect(state.draftExercises).toEqual([])
    })
  })

  describe('startSession', () => {
    it('isActive を true にして startedAt を記録する', () => {
      useWorkoutSessionStore.getState().startSession()
      const state = useWorkoutSessionStore.getState()
      expect(state.isActive).toBe(true)
      expect(state.startedAt).toBeTruthy()
      expect(state.draftExercises).toEqual([])
    })

    it('指定した日付を使用する', () => {
      useWorkoutSessionStore.getState().startSession('2026-03-08' as DateString)
      const state = useWorkoutSessionStore.getState()
      expect(state.date).toBe('2026-03-08')
    })

    it('日付が指定されない場合は今日を使用する', () => {
      useWorkoutSessionStore.getState().startSession()
      const state = useWorkoutSessionStore.getState()
      expect(state.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('chatStore のメッセージをクリアする（前セッションの残留防止）', () => {
      useChatStore.setState({
        messages: [makeChatMessage()],
        isLoading: false,
        error: null,
      })
      useWorkoutSessionStore.getState().startSession()
      expect(useChatStore.getState().messages).toEqual([])
    })
  })

  describe('endSession', () => {
    it('ワークアウトを保存して状態をリセットする', () => {
      const { startSession, addExercise, completeSet, endSession } =
        useWorkoutSessionStore.getState()

      startSession('2026-03-08' as DateString)
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      completeSet(0, { weight: 60, reps: 10 })
      endSession()

      const state = useWorkoutSessionStore.getState()
      expect(state.isActive).toBe(false)
      expect(state.startedAt).toBeNull()
      expect(state.draftExercises).toEqual([])
    })

    it('WorkoutRepository に保存する', () => {
      const { startSession, addExercise, completeSet, endSession } =
        useWorkoutSessionStore.getState()

      startSession('2026-03-08' as DateString)
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      completeSet(0, { weight: 60, reps: 10 })
      endSession()

      // Check localStorage for saved workout
      const raw = localStorage.getItem('gymini:workouts')
      expect(raw).toBeTruthy()
      const workouts = JSON.parse(raw!)
      expect(workouts).toHaveLength(1)
      expect(workouts[0].exercises[0].exerciseId).toBe('bench')
      expect(workouts[0].exercises[0].sets).toEqual([{ weight: 60, reps: 10 }])
    })

    it('chatStore のメッセージをクリアする', () => {
      const { startSession, endSession } = useWorkoutSessionStore.getState()
      startSession('2026-03-08' as DateString)
      useChatStore.setState({
        messages: [makeChatMessage()],
        isLoading: false,
        error: null,
      })
      endSession()
      expect(useChatStore.getState().messages).toEqual([])
    })

    it('完了を押さずにセッションを終了したとき編集中のセットを復元する', () => {
      const { startSession, addExercise, completeSet, editCompletedSet, endSession } =
        useWorkoutSessionStore.getState()

      startSession('2026-03-08' as DateString)
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      completeSet(0, { weight: 60, reps: 10 })
      completeSet(0, { weight: 65, reps: 8 })

      // Click edit on first set without completing the edit
      editCompletedSet(0, 0)
      // End the session immediately
      endSession()

      const raw = localStorage.getItem('gymini:workouts')
      const workouts = JSON.parse(raw!)
      expect(workouts[0].exercises[0].sets).toEqual([
        { weight: 60, reps: 10 },
        { weight: 65, reps: 8 },
      ])
    })
  })

  describe('addExercise', () => {
    it('recording 状態で pendingSet を持つ種目を追加する', () => {
      useWorkoutSessionStore.getState().startSession()
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises).toHaveLength(1)
      expect(draftExercises[0].cardState).toBe('recording')
      expect(draftExercises[0].pendingSet).toEqual({ weight: 0, reps: 0 })
      expect(draftExercises[0].sets).toEqual([])
      expect(draftExercises[0].editingSetIndex).toBeNull()
    })

    it('新しい種目を追加するとき現在 recording の種目を非アクティブにする', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].cardState).toBe('idle')
      expect(draftExercises[0].pendingSet).toBeNull()
      expect(draftExercises[1].cardState).toBe('recording')
    })

    it('新しい種目が追加されたとき編集中のセットを復元する', () => {
      const { startSession, addExercise, completeSet } =
        useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      completeSet(0, { weight: 60, reps: 10 })
      completeSet(0, { weight: 65, reps: 8 })

      // Start editing first set
      useWorkoutSessionStore.getState().editCompletedSet(0, 0)
      // Adding a new exercise should restore the set being edited
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].sets).toHaveLength(2)
      expect(draftExercises[0].sets[0]).toEqual({ weight: 60, reps: 10 })
      expect(draftExercises[0].sets[1]).toEqual({ weight: 65, reps: 8 })
      expect(draftExercises[0].pendingSet).toBeNull()
    })

    it('origin 未指定時はデフォルトで manual になる', () => {
      useWorkoutSessionStore.getState().startSession()
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].origin).toBe('manual')
    })

    it('origin: ai-suggested を指定すると ai-suggested で追加される', () => {
      useWorkoutSessionStore.getState().startSession()
      useWorkoutSessionStore.getState().addExercise({
        exerciseId: 'bench',
        exerciseName: 'ベンチプレス',
        origin: 'ai-suggested',
      })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].origin).toBe('ai-suggested')
    })
  })

  describe('addExerciseWithSets', () => {
    it('origin 未指定時はデフォルトで manual になる', () => {
      useWorkoutSessionStore.getState().startSession()
      useWorkoutSessionStore.getState().addExerciseWithSets({
        exerciseId: 'bench',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 60, reps: 10 }],
      })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].origin).toBe('manual')
    })

    it('origin: ai-suggested を指定すると ai-suggested で追加される', () => {
      useWorkoutSessionStore.getState().startSession()
      useWorkoutSessionStore.getState().addExerciseWithSets({
        exerciseId: 'bench',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 60, reps: 10 }],
        origin: 'ai-suggested',
      })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].origin).toBe('ai-suggested')
    })
  })

  describe('acceptSuggestedExercise', () => {
    it('ai-suggested の種目を manual に昇格させる', () => {
      useWorkoutSessionStore.getState().startSession()
      useWorkoutSessionStore.getState().addExerciseWithSets({
        exerciseId: 'bench',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 60, reps: 10 }],
        origin: 'ai-suggested',
      })

      useWorkoutSessionStore.getState().acceptSuggestedExercise(0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].origin).toBe('manual')
      expect(draftExercises[0].sets).toEqual([{ weight: 60, reps: 10 }])
    })

    it('manual の種目には作用しない（no-op）', () => {
      useWorkoutSessionStore.getState().startSession()
      useWorkoutSessionStore.getState().addExerciseWithSets({
        exerciseId: 'bench',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 60, reps: 10 }],
      })
      const before = useWorkoutSessionStore.getState().draftExercises

      useWorkoutSessionStore.getState().acceptSuggestedExercise(0)

      expect(useWorkoutSessionStore.getState().draftExercises).toBe(before)
    })

    it('範囲外の index に対しては作用しない（no-op）', () => {
      useWorkoutSessionStore.getState().startSession()
      const before = useWorkoutSessionStore.getState().draftExercises

      useWorkoutSessionStore.getState().acceptSuggestedExercise(99)

      expect(useWorkoutSessionStore.getState().draftExercises).toBe(before)
    })

    it('sets 引数を渡すと編集後の sets で保存しつつ origin を manual に昇格', () => {
      useWorkoutSessionStore.getState().startSession()
      useWorkoutSessionStore.getState().addExerciseWithSets({
        exerciseId: 'bench',
        exerciseName: 'ベンチプレス',
        sets: [{ weight: 60, reps: 10 }],
        origin: 'ai-suggested',
      })

      useWorkoutSessionStore
        .getState()
        .acceptSuggestedExercise(0, [
          { weight: 80, reps: 8 },
          { weight: 75, reps: 6 },
        ])

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].origin).toBe('manual')
      expect(draftExercises[0].sets).toEqual([
        { weight: 80, reps: 8 },
        { weight: 75, reps: 6 },
      ])
    })
  })

  describe('activateExercise', () => {
    it('idle の種目を recording にアクティブ化する', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      // Add second exercise, which deactivates first
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      // Activate first exercise
      useWorkoutSessionStore.getState().activateExercise(0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].cardState).toBe('recording')
      expect(draftExercises[0].pendingSet).toEqual({ weight: 0, reps: 0 })
      expect(draftExercises[0].editingSetIndex).toBeNull()
      expect(draftExercises[1].cardState).toBe('idle')
      expect(draftExercises[1].pendingSet).toBeNull()
    })

    it('pendingSet を最後に完了したセットの値で初期化する', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      useWorkoutSessionStore.getState().completeSet(0, { weight: 60, reps: 10 })

      // Add second exercise (deactivates first)
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      // Reactivate first exercise
      useWorkoutSessionStore.getState().activateExercise(0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].pendingSet).toEqual({ weight: 60, reps: 10 })
    })
  })

  describe('completeSet', () => {
    it('pendingSet を sets に移して同じ値で次の pendingSet を作成する', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })

      useWorkoutSessionStore
        .getState()
        .completeSet(0, { weight: 60, reps: 10 })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].sets).toEqual([{ weight: 60, reps: 10 }])
      expect(draftExercises[0].pendingSet).toEqual({ weight: 60, reps: 10 })
    })

    it('複数のセットを追加する', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })

      useWorkoutSessionStore
        .getState()
        .completeSet(0, { weight: 60, reps: 10 })
      useWorkoutSessionStore.getState().completeSet(0, { weight: 65, reps: 8 })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].sets).toHaveLength(2)
      expect(draftExercises[0].sets[1]).toEqual({ weight: 65, reps: 8 })
      expect(draftExercises[0].pendingSet).toEqual({ weight: 65, reps: 8 })
    })

    it('編集したセットを末尾に追加せず元の位置に再挿入する', () => {
      const { startSession, addExercise, completeSet } =
        useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      completeSet(0, { weight: 60, reps: 10 }) // index 0
      completeSet(0, { weight: 65, reps: 8 })  // index 1
      completeSet(0, { weight: 70, reps: 6 })  // index 2

      // Edit the first set (index 0)
      useWorkoutSessionStore.getState().editCompletedSet(0, 0)
      // Complete the edit with new values
      useWorkoutSessionStore.getState().completeSet(0, { weight: 62, reps: 10 })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].sets).toHaveLength(3)
      // Edited set must be back at index 0, not appended at the end
      expect(draftExercises[0].sets[0]).toEqual({ weight: 62, reps: 10 })
      expect(draftExercises[0].sets[1]).toEqual({ weight: 65, reps: 8 })
      expect(draftExercises[0].sets[2]).toEqual({ weight: 70, reps: 6 })
      expect(draftExercises[0].editingSetIndex).toBeNull()
      // Editing completion must return to idle — no next recording row auto-added
      expect(draftExercises[0].cardState).toBe('idle')
    })

    it('編集完了後は idle に戻り次のセット入力行を自動追加しない', () => {
      const { startSession, addExercise, completeSet } =
        useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      completeSet(0, { weight: 60, reps: 10 })

      useWorkoutSessionStore.getState().editCompletedSet(0, 0)
      useWorkoutSessionStore.getState().completeSet(0, { weight: 62, reps: 10 })

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].cardState).toBe('idle')
      expect(draftExercises[0].editingSetIndex).toBeNull()
      // Sets count must remain 1 — no extra set appended
      expect(draftExercises[0].sets).toHaveLength(1)
      expect(draftExercises[0].sets[0]).toEqual({ weight: 62, reps: 10 })
    })
  })

  describe('editCompletedSet', () => {
    it('完了したセットを編集のため pendingSet に戻す', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      useWorkoutSessionStore
        .getState()
        .completeSet(0, { weight: 60, reps: 10 })
      useWorkoutSessionStore.getState().completeSet(0, { weight: 65, reps: 8 })

      // Edit first set
      useWorkoutSessionStore.getState().editCompletedSet(0, 0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].sets).toHaveLength(1)
      expect(draftExercises[0].sets[0]).toEqual({ weight: 65, reps: 8 })
      expect(draftExercises[0].pendingSet).toEqual({ weight: 60, reps: 10 })
      expect(draftExercises[0].cardState).toBe('recording')
      expect(draftExercises[0].editingSetIndex).toBe(0)
    })

    it('他の recording 中の種目を非アクティブにする', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      useWorkoutSessionStore
        .getState()
        .completeSet(0, { weight: 60, reps: 10 })
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      // Edit set on first exercise while second is recording
      useWorkoutSessionStore.getState().editCompletedSet(0, 0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].cardState).toBe('recording')
      expect(draftExercises[1].cardState).toBe('idle')
    })

    it('ペンを2回クリックしたとき最初のセットを復元して2番目を正しく編集する', () => {
      const { startSession, addExercise, completeSet } =
        useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      completeSet(0, { weight: 60, reps: 10 }) // A - index 0
      completeSet(0, { weight: 65, reps: 8 })  // B - index 1
      completeSet(0, { weight: 70, reps: 6 })  // C - index 2

      // First: edit A (index 0). sets become [B, C], pendingSet = A
      useWorkoutSessionStore.getState().editCompletedSet(0, 0)

      // Second: click pen on C which is now at displayed index 1 in [B, C]
      // This should restore A first, then edit C
      useWorkoutSessionStore.getState().editCompletedSet(0, 1)

      const { draftExercises } = useWorkoutSessionStore.getState()
      // C is now in pendingSet, A and B should be in sets
      expect(draftExercises[0].pendingSet).toEqual({ weight: 70, reps: 6 })
      expect(draftExercises[0].sets).toHaveLength(2)
      expect(draftExercises[0].sets[0]).toEqual({ weight: 60, reps: 10 }) // A restored
      expect(draftExercises[0].sets[1]).toEqual({ weight: 65, reps: 8 })  // B
    })

    it('完了セットのペンをクリックしたとき空でない pendingSet を自動保存する', () => {
      const { startSession, addExercise, completeSet, updatePendingSet } =
        useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      completeSet(0, { weight: 60, reps: 10 })
      // Enter data for a new set but don't complete it
      updatePendingSet(0, { weight: 80, reps: 8 })

      // Click pen on the first completed set
      useWorkoutSessionStore.getState().editCompletedSet(0, 0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      // The new set (80kg×8) should be auto-saved; {60,10} moved to pendingSet for editing
      expect(draftExercises[0].sets).toHaveLength(1)
      expect(draftExercises[0].sets[0]).toEqual({ weight: 80, reps: 8 })
      expect(draftExercises[0].pendingSet).toEqual({ weight: 60, reps: 10 })
    })

    it('完了セットのペンをクリックしても空の pendingSet を追加しない', () => {
      const { startSession, addExercise, completeSet } =
        useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      completeSet(0, { weight: 60, reps: 10 })
      // pendingSet is still the default {weight: 0, reps: 0}

      useWorkoutSessionStore.getState().editCompletedSet(0, 0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      // No spurious empty set should be added
      expect(draftExercises[0].sets).toHaveLength(0)
      expect(draftExercises[0].pendingSet).toEqual({ weight: 60, reps: 10 })
    })
  })

  describe('deleteCompletedSet', () => {
    it('指定したセットを削除する', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      useWorkoutSessionStore
        .getState()
        .completeSet(0, { weight: 60, reps: 10 })
      useWorkoutSessionStore.getState().completeSet(0, { weight: 65, reps: 8 })

      useWorkoutSessionStore.getState().deleteCompletedSet(0, 0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].sets).toHaveLength(1)
      expect(draftExercises[0].sets[0]).toEqual({ weight: 65, reps: 8 })
    })
  })

  describe('deleteExercise', () => {
    it('指定インデックスの種目を削除する', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      useWorkoutSessionStore.getState().deleteExercise(0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises).toHaveLength(1)
      expect(draftExercises[0].exerciseId).toBe('squat')
    })

    it('末尾の種目を削除できる', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      useWorkoutSessionStore.getState().deleteExercise(1)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises).toHaveLength(1)
      expect(draftExercises[0].exerciseId).toBe('bench')
    })

    it('唯一の種目を削除するとリストが空になる', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })

      useWorkoutSessionStore.getState().deleteExercise(0)

      expect(useWorkoutSessionStore.getState().draftExercises).toHaveLength(0)
    })
  })

  describe('reorderExercise', () => {
    it('up で指定種目と前の種目が入れ替わる', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })
      addExercise({ exerciseId: 'dead', exerciseName: 'デッドリフト' })

      useWorkoutSessionStore.getState().reorderExercise(1, 'up')

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].exerciseId).toBe('squat')
      expect(draftExercises[1].exerciseId).toBe('bench')
      expect(draftExercises[2].exerciseId).toBe('dead')
    })

    it('down で指定種目と次の種目が入れ替わる', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })
      addExercise({ exerciseId: 'dead', exerciseName: 'デッドリフト' })

      useWorkoutSessionStore.getState().reorderExercise(1, 'down')

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].exerciseId).toBe('bench')
      expect(draftExercises[1].exerciseId).toBe('dead')
      expect(draftExercises[2].exerciseId).toBe('squat')
    })

    it('先頭種目に up しても順序が変わらない', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      useWorkoutSessionStore.getState().reorderExercise(0, 'up')

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].exerciseId).toBe('bench')
      expect(draftExercises[1].exerciseId).toBe('squat')
    })

    it('末尾種目に down しても順序が変わらない', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      useWorkoutSessionStore.getState().reorderExercise(1, 'down')

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].exerciseId).toBe('bench')
      expect(draftExercises[1].exerciseId).toBe('squat')
    })
  })

  describe('toggleExerciseCard', () => {
    it('idle カードを折りたたむ', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      // Add second to make first idle
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })

      useWorkoutSessionStore.getState().toggleExerciseCard(0)
      expect(
        useWorkoutSessionStore.getState().draftExercises[0].cardState,
      ).toBe('collapsed')
    })

    it('recording カードを折りたたむ', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })

      useWorkoutSessionStore.getState().toggleExerciseCard(0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].cardState).toBe('collapsed')
      expect(draftExercises[0].pendingSet).toBeNull()
    })

    it('折りたたまれたカードを idle に展開する', () => {
      const { startSession, addExercise } = useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      // Add second to make first idle, then collapse first
      useWorkoutSessionStore
        .getState()
        .addExercise({ exerciseId: 'squat', exerciseName: 'スクワット' })
      useWorkoutSessionStore.getState().toggleExerciseCard(0)

      // Expand
      useWorkoutSessionStore.getState().toggleExerciseCard(0)
      expect(
        useWorkoutSessionStore.getState().draftExercises[0].cardState,
      ).toBe('idle')
    })

    it('カードを折りたたんだとき編集中のセットを復元する', () => {
      const { startSession, addExercise, completeSet } =
        useWorkoutSessionStore.getState()
      startSession()
      addExercise({ exerciseId: 'bench', exerciseName: 'ベンチプレス' })
      completeSet(0, { weight: 60, reps: 10 })
      completeSet(0, { weight: 65, reps: 8 })

      // Start editing first set
      useWorkoutSessionStore.getState().editCompletedSet(0, 0)
      // Collapse the card without completing the edit
      useWorkoutSessionStore.getState().toggleExerciseCard(0)

      const { draftExercises } = useWorkoutSessionStore.getState()
      expect(draftExercises[0].cardState).toBe('collapsed')
      expect(draftExercises[0].sets).toHaveLength(2)
      expect(draftExercises[0].sets[0]).toEqual({ weight: 60, reps: 10 })
      expect(draftExercises[0].sets[1]).toEqual({ weight: 65, reps: 8 })
    })
  })
})
