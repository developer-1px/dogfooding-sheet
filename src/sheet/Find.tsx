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
  const [caseSensitive, setCS] = useState(false)
  const [regex, setRegex] = useState(false)

  const { rootProps } = useDialogPattern({
    open, modal: false,
    label: mode === 'replace' ? '찾기 및 바꾸기' : '찾기',
    onOpenChange: (next) => { if (!next) onClose() },
  })

  const { matches, jump, resetIdx, current, counter } = useFind({ query: q, cells, display, onJump, caseSensitive, regex })

  if (!open) return null

  const sub = (s: string): string => {
    if (regex) { try { return s.replace(new RegExp(q, caseSensitive ? 'g' : 'gi'), r) } catch { return s } }
    if (caseSensitive) return s.split(q).join(r)
    return s.replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), r)
  }
  const replaceOne = () => {
    if (!current || !q) return
    const k = cellIdToKey(current)
    if (k) writeCell(k, sub(cells[k] ?? ''))
    jump(1)
  }
  const replaceAll = () => {
    if (!q) return
    for (const id of matches) {
      const k = cellIdToKey(id)
      if (k) writeCell(k, sub(cells[k] ?? ''))
    }
  }

  return (
    <div {...rootProps} className="find-bar">
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); resetIdx() }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); jump(e.shiftKey ? -1 : 1) }
        }}
        placeholder="찾기"
      />
      {mode === 'replace' && (
        <input
          value={r}
          onChange={(e) => setR(e.target.value)}
          placeholder="바꾸기"
        />
      )}
      <label title="대소문자 구분"><input type="checkbox" checked={caseSensitive} onChange={(e) => { setCS(e.target.checked); resetIdx() }} />Aa</label>
      <label title="정규식"><input type="checkbox" checked={regex} onChange={(e) => { setRegex(e.target.checked); resetIdx() }} />.*</label>
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
