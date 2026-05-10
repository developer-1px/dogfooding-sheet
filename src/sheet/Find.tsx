import { useState } from 'react'
import { useDialogPattern } from '@p/aria-kernel/patterns'
import { cellKey } from './schema'
import { useFind } from './useFind'

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

  const { rootProps } = useDialogPattern({
    open, modal: false,
    label: mode === 'replace' ? '찾기 및 바꾸기' : '찾기',
  })

  const { matches, jump, resetIdx, current, counter } = useFind({ query: q, cells, display, onJump })

  if (!open) return null

  const replaceOne = () => {
    if (!current || !q) return
    const k = cellIdToKey(current)
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
    <div {...rootProps} className="find-bar">
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); resetIdx() }}
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
      <span className="count">{counter}</span>
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
