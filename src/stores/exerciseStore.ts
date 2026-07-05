import { create } from 'zustand'
import * as ExerciseRepository from '@/lib/exerciseRepository'
import type { Exercise, ExerciseCategory } from '@/schemas/exercise'

/**
 * ExerciseRepository を薄くラップする Zustand store。
 *
 * - Component/hook は本 store を直接 import しない（`useExercises` hook 経由で使う）
 * - Repository が single source of truth（localStorage）。本 store は React 向けキャッシュ。
 * - mutation 系アクションは Repository に委譲したあと `set` で一覧を再読み込みする
 */

type State = {
  exercises: Exercise[]
}

type Actions = {
  load: () => void
  create: (name: string, category?: ExerciseCategory) => Exercise
  update: (id: string, name: string, category?: ExerciseCategory) => Exercise
  remove: (id: string) => void
}

function snapshot(): Exercise[] {
  return ExerciseRepository.getAll()
}

export const useExerciseStore = create<State & Actions>()((set) => ({
  exercises: snapshot(),

  load: () => set({ exercises: snapshot() }),

  create: (name: string, category?: ExerciseCategory) => {
    const exercise = ExerciseRepository.create(name, category)
    set({ exercises: snapshot() })
    return exercise
  },

  update: (id: string, name: string, category?: ExerciseCategory) => {
    const exercise = ExerciseRepository.update(id, name, category)
    set({ exercises: snapshot() })
    return exercise
  },

  remove: (id: string) => {
    ExerciseRepository.remove(id)
    set({ exercises: snapshot() })
  },
}))
