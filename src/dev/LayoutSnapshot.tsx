import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

/**
 * LayoutSnapshot — dev専用のレイアウト調査オーバーレイ。
 *
 * 使い方:
 * 1. 右下の ◉ ボタンをタップ → 調整したい要素をタップ
 * 2. コンパクトなレイアウトツリーが表示される → コピーしてClaudeに貼る
 *
 * 出力例:
 *   section.flex.flex-col.gap-4.p-6 486x312 <WorkoutList>
 *     h2.text-lg.font-bold 120x28 "今日の記録"
 *     div.flex.gap-2 454x40 {overflow-x:auto}
 *       button.px-3.py-1.rounded-full 72x32 <MuscleChip> "胸"
 *       …+4
 *
 * <Name> はそのDOMを描画しているReactコンポーネント境界（devビルド限定）。
 */

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'])
const MAX_DEPTH = 7
const MAX_CHILDREN = 10
const MAX_CLASSES = 12
const MAX_TEXT = 16

/* ---- React fiber からコンポーネント名を復元 (devビルドのみ) ---- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fiberOf(el: Element): any {
  const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return key ? (el as any)[key] : null
}

/** このDOM要素を描画している最も近い自作コンポーネント名を返す */
function componentName(el: Element): string {
  let fiber = fiberOf(el)
  while (fiber) {
    const t = fiber.type
    if (typeof t === 'function') return t.displayName || t.name || ''
    // forwardRef / memo でラップされている場合
    if (t && typeof t === 'object') {
      const inner = t.render ?? t.type
      const name = inner?.displayName || inner?.name
      if (name) return name
    }
    fiber = fiber.return
  }
  return ''
}

/** Tailwindクラスだけではわからない計算済みスタイルを補足する */
function notableComputed(el: Element): string {
  const cs = getComputedStyle(el)
  const notes: string[] = []
  if (cs.position !== 'static') notes.push(cs.position)
  if (cs.overflowX === 'auto' || cs.overflowX === 'scroll')
    notes.push('overflow-x:' + cs.overflowX)
  if (cs.display === 'grid')
    notes.push(`grid-cols:${cs.gridTemplateColumns.split(' ').length}`)
  return notes.length ? ` {${notes.join(',')}}` : ''
}

function ownText(el: Element): string {
  let t = ''
  for (const n of el.childNodes)
    if (n.nodeType === Node.TEXT_NODE) t += n.textContent ?? ''
  t = t.trim().replace(/\s+/g, ' ')
  if (!t) return ''
  return ` "${t.length > MAX_TEXT ? t.slice(0, MAX_TEXT) + '…' : t}"`
}

function classStr(el: Element): string {
  const cls =
    typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean) : []
  const shown = cls.slice(0, MAX_CLASSES)
  const extra = cls.length > MAX_CLASSES ? `(+${cls.length - MAX_CLASSES}cls)` : ''
  return (shown.length ? '.' + shown.join('.') : '') + extra
}

function serialize(
  el: Element,
  depth: number,
  lines: string[],
  parentComp: string,
): void {
  if (SKIP_TAGS.has(el.tagName)) return
  const pad = '  '.repeat(depth)
  const r = el.getBoundingClientRect()
  const size = `${Math.round(r.width)}x${Math.round(r.height)}`
  const tag = el.tagName.toLowerCase()

  if (tag === 'svg') {
    lines.push(`${pad}svg ${size}`)
    return // svg内部はノイズなので省略
  }

  // コンポーネント境界でだけ <Name> を表示（親と同じなら省略してノイズ削減）
  const comp = componentName(el)
  const compTag = comp && comp !== parentComp ? ` <${comp}>` : ''

  lines.push(
    `${pad}${tag}${classStr(el)} ${size}${compTag}${ownText(el)}${notableComputed(el)}`,
  )

  if (depth >= MAX_DEPTH) {
    if (el.children.length) lines.push(`${pad}  …deeper(${el.children.length})`)
    return
  }
  const kids = Array.from(el.children)
  kids
    .slice(0, MAX_CHILDREN)
    .forEach((c) => serialize(c, depth + 1, lines, comp || parentComp))
  if (kids.length > MAX_CHILDREN) lines.push(`${pad}  …+${kids.length - MAX_CHILDREN}`)
}

// eslint-disable-next-line react-refresh/only-export-components
export function snapshotElement(el: Element): string {
  const lines: string[] = [`viewport ${window.innerWidth}x${window.innerHeight}`]
  serialize(el, 0, lines, '')
  return lines.join('\n')
}

export default function LayoutSnapshot() {
  const [picking, setPicking] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const onPick = useCallback((e: MouseEvent) => {
    const target = e.target as Element | null
    if (!target || target.closest('[data-layout-snapshot]')) return
    e.preventDefault()
    e.stopPropagation()
    setOutput(snapshotElement(target))
    setPicking(false)
  }, [])

  useEffect(() => {
    if (!picking) return
    document.addEventListener('click', onPick, { capture: true })
    return () => document.removeEventListener('click', onPick, { capture: true })
  }, [picking, onPick])

  const copy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div data-layout-snapshot style={{ position: 'fixed', zIndex: 99999 }}>
      <button
        onClick={() => {
          setOutput(null)
          setPicking((p) => !p)
        }}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: 'none',
          background: picking ? '#e11d48' : '#0f172a',
          color: '#fff',
          fontSize: 18,
          boxShadow: '0 2px 8px rgba(0,0,0,.35)',
        }}
      >
        {picking ? '×' : '◉'}
      </button>

      {picking && (
        <div
          style={{
            position: 'fixed',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0f172a',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: 999,
            fontSize: 13,
          }}
        >
          調整したい要素をタップ
        </div>
      )}

      {output && (
        <div
          style={{
            position: 'fixed',
            inset: '10% 4%',
            background: '#0f172a',
            color: '#e2e8f0',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0,0,0,.5)',
          }}
        >
          <div style={{ display: 'flex', gap: 8, padding: 10 }}>
            <button onClick={copy} style={btn('#2563eb')}>
              {copied ? '✓ copied' : 'コピー'}
            </button>
            <button onClick={() => setOutput(null)} style={btn('#334155')}>
              閉じる
            </button>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                opacity: 0.6,
                alignSelf: 'center',
              }}
            >
              {output.split('\n').length} lines
            </span>
          </div>
          <pre
            style={{
              margin: 0,
              padding: '0 12px 12px',
              overflow: 'auto',
              fontSize: 11,
              lineHeight: 1.5,
              whiteSpace: 'pre',
            }}
          >
            {output}
          </pre>
        </div>
      )}
    </div>
  )
}

const btn = (bg: string): CSSProperties => ({
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '6px 14px',
  fontSize: 13,
})
