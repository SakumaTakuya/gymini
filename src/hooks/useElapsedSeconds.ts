import { useEffect, useState } from 'react'

function calcElapsed(startedAt: string | null): number {
  if (!startedAt) return 0
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
}

/**
 * startedAt からの経過秒数を 1 秒ごとに返す。
 *
 * 毎秒の再レンダーはこのフックを呼んだコンポーネントに閉じる。
 * 以前は useWorkoutSession がこれを内包していたため、TrainingPage →
 * ActiveSessionView（全カード + 全チャットバブル）がタイマー表示のためだけに
 * 毎秒再レンダーされていた。経過時間を表示するコンポーネント（TimerPill の
 * ラッパー等）だけがこのフックを使うこと。
 */
export function useElapsedSeconds(startedAt: string | null): number {
  // startedAt が変わったら次 tick を待たずレンダー中に即補正する。
  // React 公式の「レンダー中に prev を比較して setState する」派生 state
  // パターン。effect 内同期 setState のカスケード再レンダーを避ける。
  const [elapsed, setElapsed] = useState(() => calcElapsed(startedAt))
  const [prevStartedAt, setPrevStartedAt] = useState(startedAt)
  if (prevStartedAt !== startedAt) {
    setPrevStartedAt(startedAt)
    setElapsed(calcElapsed(startedAt))
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(calcElapsed(startedAt))
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  return elapsed
}
