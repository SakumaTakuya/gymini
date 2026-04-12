import { useEffect, useMemo } from 'react'
import { useExerciseStore } from '@/stores/exerciseStore'
import type { Exercise } from '@/types'

const STORAGE_KEY = 'gymini:exercises'

/**
 * 種目マスターの読み書きを行う公開 hook。
 *
 * UI コンポーネントは本 hook のみを介して種目データにアクセスする。
 * `ExerciseRepository` を直接 import してはならない（一貫性と反映漏れ防止のため）。
 *
 * 機能:
 * - `exercises`: 最新の種目一覧（subscribe）
 * - `search(query)`: 部分一致検索。state 変更で再計算
 * - `create/update/remove`: 内部で Repository を呼び、全 subscriber に伝播
 * - 他タブでの localStorage 変更を `storage` event で自動反映
 */
export function useExercises() {
  const exercises = useExerciseStore((s) => s.exercises)
  const load = useExerciseStore((s) => s.load)
  const create = useExerciseStore((s) => s.create)
  const update = useExerciseStore((s) => s.update)
  const remove = useExerciseStore((s) => s.remove)

  // 初期マウント時に localStorage と同期（テスト環境や外部書き換え後の再マウント対策）
  useEffect(() => {
    load()
  }, [load])

  // 他タブでの localStorage 変更に追従
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) load()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [load])

  const search = useMemo(() => {
    return (query: string): Exercise[] => {
      const trimmed = query.trim()
      if (trimmed === '') return exercises
      const lower = trimmed.toLowerCase()
      return exercises.filter((e) => e.name.toLowerCase().includes(lower))
    }
  }, [exercises])

  return {
    exercises,
    search,
    create,
    update,
    remove,
  }
}
