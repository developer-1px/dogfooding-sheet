import { useEffect, useMemo, useState } from 'react'
import { COL_LETTERS, ROW_COUNT, cellKey } from './schema'

interface Args {
  query: string
  cells: Record<string, string>
  display: (k: string) => string
  onJump: (cellId: string) => void
  caseSensitive?: boolean
}

export function useFind({ query, cells, display, onJump, caseSensitive = false }: Args) {
  const [idx, setIdx] = useState(0)

  const matches = useMemo(() => {
    if (!query) return []
    const fold = (s: string) => caseSensitive ? s : s.toLowerCase()
    const needle = fold(query)
    const out: string[] = []
    for (let row = 0; row < ROW_COUNT; row++) {
      for (const c of COL_LETTERS) {
        const k = cellKey(c, row)
        if (fold(cells[k] ?? '').includes(needle) || fold(display(k)).includes(needle)) out.push(`r${row}-${c}`)
      }
    }
    return out
  }, [query, cells, display, caseSensitive])

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
