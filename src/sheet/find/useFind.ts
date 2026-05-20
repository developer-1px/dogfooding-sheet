import { useEffect, useMemo, useState } from 'react'
import { cellKey, cellId, colIndex, type Cells, type Display } from '../schema'
import { makeFindMatcher } from './findRegex'

interface Args {
  query: string
  cells: Cells
  display: Display
  onJump: (cellId: string) => void
  caseSensitive?: boolean
  regex?: boolean
  skipIds?: Set<string>
  rowCount: number
  colLetters: readonly string[]
}

export function useFind({ query, cells, display, onJump, caseSensitive = false, regex = false, skipIds, rowCount, colLetters }: Args) {
  const [idx, setIdx] = useState(0)

  const matches = useMemo(() => {
    if (!query) return []
    const test = makeFindMatcher(query, { caseSensitive, regex })
    const out: string[] = []
    for (let row = 0; row < rowCount; row++) {
      for (const c of colLetters) {
        const k = cellKey(c, row); const id = cellId(c, row)
        if (skipIds?.has(`${row},${colIndex(c)}`)) continue
        if (test(cells[k] ?? '') || test(display(k))) out.push(id)
      }
    }
    return out
  }, [query, cells, display, caseSensitive, regex, skipIds, rowCount, colLetters])

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
