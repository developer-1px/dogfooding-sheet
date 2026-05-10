import { useEffect, useMemo, useRef, useState } from 'react'
import { COL_LETTERS, ROW_COUNT, cellKey } from './schema'

interface Props {
  open: boolean
  onClose: () => void
  cells: Record<string, string>
  display: (k: string) => string
  onJump: (cellId: string) => void
}

export function Find({ open, onClose, cells, display, onJump }: Props) {
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  const matches = useMemo(() => {
    if (!q) return []
    const needle = q.toLowerCase()
    const out: string[] = []
    for (let r = 0; r < ROW_COUNT; r++) {
      for (const c of COL_LETTERS) {
        const k = cellKey(c, r)
        const raw = (cells[k] ?? '').toLowerCase()
        const shown = display(k).toLowerCase()
        if (raw.includes(needle) || shown.includes(needle)) out.push(`r${r}-${c}`)
      }
    }
    return out
  }, [q, cells, display])

  useEffect(() => {
    if (matches.length > 0) onJump(matches[idx % matches.length])
  }, [matches, idx, onJump])

  if (!open) return null

  const jump = (delta: number) => {
    if (matches.length === 0) return
    setIdx((idx + delta + matches.length) % matches.length)
  }

  return (
    <div className="find-bar" role="dialog" aria-label="찾기">
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => { setQ(e.target.value); setIdx(0) }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); jump(e.shiftKey ? -1 : 1) }
          else if (e.key === 'Escape') { e.preventDefault(); onClose() }
        }}
        placeholder="찾기"
      />
      <span className="count">{q && matches.length === 0 ? '0개' : matches.length > 0 ? `${(idx % matches.length) + 1}/${matches.length}` : ''}</span>
      <button onClick={() => jump(-1)} disabled={matches.length === 0}>↑</button>
      <button onClick={() => jump(1)} disabled={matches.length === 0}>↓</button>
      <button onClick={onClose}>✕</button>
    </div>
  )
}
