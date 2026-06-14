import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * prefers-reduced-motion: reduce の現在値を返し、設定変更に追従する React フック。
 * matchMedia 判定は lib/motion の prefersReducedMotion に一元化する。
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
