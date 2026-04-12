import { create } from 'zustand'
import * as ExerciseRepository from '@/lib/exerciseRepository'
import type { Exercise } from '@/types'

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
  create: (name: string) => Exercise
  update: (id: string, name: string) => Exercise
  remove: (id: string) => void
}

function snapshot(): Exercise[] {
  return ExerciseRepository.getAll()
}

export const useExerciseStore = create<State & Actions>()((set) => ({
  exercises: snapshot(),

  load: () => set({ exercises: snapshot() }),

  create: (name: string) => {
    const exercise = ExerciseRepository.create(name)
    set({ exercises: snapshot() })
    return exercise
  },

  update: (id: string, name: string) => {
    const exercise = ExerciseRepository.update(id, name)
    set({ exercises: snapshot() })
    return exercise
  },

  remove: (id: string) => {
    ExerciseRepository.remove(id)
    set({ exercises: snapshot() })
  },
}))
