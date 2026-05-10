import { useEffect, useMemo, useState } from 'react'
import { COL_LETTERS, ROW_COUNT, cellKey } from './schema'

interface Args {
  query: string
  cells: Record<string, string>
  display: (k: string) => string
  onJump: (cellId: string) => void
  caseSensitive?: boolean
  regex?: boolean
}

export function useFind({ query, cells, display, onJump, caseSensitive = false, regex = false }: Args) {
  const [idx, setIdx] = useState(0)

  const matches = useMemo(() => {
    if (!query) return []
    const test: (s: string) => boolean = regex
      ? (() => { try { const re = new RegExp(query, caseSensitive ? '' : 'i'); return (s) => re.test(s) } catch { return () => false } })()
      : (() => { const fold = (s: string) => caseSensitive ? s : s.toLowerCase(); const needle = fold(query); return (s) => fold(s).includes(needle) })()
    const out: string[] = []
    for (let row = 0; row < ROW_COUNT; row++) {
      for (const c of COL_LETTERS) {
        const k = cellKey(c, row)
        if (test(cells[k] ?? '') || test(display(k))) out.push(`r${row}-${c}`)
      }
    }
    return out
  }, [query, cells, display, caseSensitive, regex])

  useEffect(() => {
    if (matches.length > 0) onJump(matches[idx % matches.length])
  }, [matches, idx, onJump])

  const jump = (delta: number) => {
    if (matches.length === 0) return
    setIdx((idx + delta + matches.length) % matches.length)
  }

  const resetIdx = () => setIdx(0)
  const current = matches.length > 0 ? matches[idx % matches.length] : null
  const counter = query && matches.length === 0 ? '0개' : matches.length > 0 ? `${(idx % matches.length) + 1}/${matches.length}` : ''

  return { matches, jump, resetIdx, current, counter }
}
