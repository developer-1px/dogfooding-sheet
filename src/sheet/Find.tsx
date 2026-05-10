import { useEffect, useMemo, useRef, useState } from 'react'
import { COL_LETTERS, ROW_COUNT, cellKey } from './schema'

interface Props {
  open: boolean
  mode: 'find' | 'replace'
  onClose: () => void
  cells: Record<string, string>
  display: (k: string) => string
  onJump: (cellId: string) => void
  writeCell: (k: string, v: string) => void
}

const cellIdToKey = (id: string): string | null => {
  const m = /^r(\d+)-([A-J])$/.exec(id)
  return m ? cellKey(m[2], Number(m[1])) : null
}

export function Find({ open, mode, onClose, cells, display, onJump, writeCell }: Props) {
  const [q, setQ] = useState('')
  const [r, setR] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => { if (open) inputRef.current?.focus() }, [open, mode])

  const matches = useMemo(() => {
    if (!q) return []
    const needle = q.toLowerCase()
    const out: string[] = []
    for (let row = 0; row < ROW_COUNT; row++) {
      for (const c of COL_LETTERS) {
        const k = cellKey(c, row)
        const raw = (cells[k] ?? '').toLowerCase()
        const shown = display(k).toLowerCase()
        if (raw.includes(needle) || shown.includes(needle)) out.push(`r${row}-${c}`)
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

  const replaceOne = () => {
    if (matches.length === 0 || !q) return
    const id = matches[idx % matches.length]
    const k = cellIdToKey(id)
    if (k) writeCell(k, (cells[k] ?? '').split(q).join(r))
    jump(1)
  }

  const replaceAll = () => {
    if (!q) return
    for (const id of matches) {
      const k = cellIdToKey(id)
      if (k) writeCell(k, (cells[k] ?? '').split(q).join(r))
    }
  }

  return (
    <div className="find-bar" role="dialog" aria-label={mode === 'replace' ? '찾기 및 바꾸기' : '찾기'}>
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
      {mode === 'replace' && (
        <input
          value={r}
          onChange={(e) => setR(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
          placeholder="바꾸기"
        />
      )}
      <span className="count">
        {q && matches.length === 0 ? '0개' : matches.length > 0 ? `${(idx % matches.length) + 1}/${matches.length}` : ''}
      </span>
      <button onClick={() => jump(-1)} disabled={matches.length === 0}>↑</button>
      <button onClick={() => jump(1)} disabled={matches.length === 0}>↓</button>
      {mode === 'replace' && (
        <>
          <button onClick={replaceOne} disabled={matches.length === 0}>바꾸기</button>
          <button onClick={replaceAll} disabled={matches.length === 0}>전체</button>
        </>
      )}
      <button onClick={onClose}>✕</button>
    </div>
  )
}
