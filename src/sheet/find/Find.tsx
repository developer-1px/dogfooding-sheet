import { useState } from 'react'
import { useDialogModalPattern } from '@interactive-os/aria-kernel/patterns'
import { cellIdToKey, type WriteCell, type WriteMany, type Display, type Cells, type Writes } from '../schema'
import { useFind } from './useFind'
import { rawCellTextJsonPath, replaceFindText } from './findRegex'

interface Props {
  open: boolean
  mode: 'find' | 'replace'
  onClose: () => void
  cells: Cells
  display: Display
  onJump: (cellId: string) => void
  writeCell: WriteCell
  writeCells: WriteMany
  replaceCellsByQuery?: (jsonPath: string, replace: (value: string) => string) => boolean
  replaceCellText?: (options: { keys: readonly string[]; search: string; replacement: string; caseSensitive?: boolean }) => boolean
  skipIds?: Set<string>
  rowCount: number
  colLetters: readonly string[]
}

export function Find({ open, mode, onClose, cells, display, onJump, writeCell, writeCells, replaceCellsByQuery, replaceCellText, skipIds, rowCount, colLetters }: Props) {
  const [q, setQ] = useState('')
  const [r, setR] = useState('')
  const [caseSensitive, setCS] = useState(false)
  const [regex, setRegex] = useState(false)

  const { matches, jump, resetIdx, current, counter } = useFind({ query: open ? q : '', cells, display, onJump, caseSensitive, regex, skipIds, rowCount, colLetters })
  const dialogLabel = mode === 'replace' ? '찾기 및 바꾸기' : '찾기'

  const { rootProps } = useDialogModalPattern({
    open,
    modal: false,
    label: dialogLabel,
    onOpenChange: (next) => { if (!next) onClose() },
    on: { Enter: () => jump(1), 'shift+Enter': () => jump(-1) },
  })

  if (!open) return null

  const sub = (s: string): string => replaceFindText(s, q, r, { caseSensitive, regex })
  const replaceOne = () => {
    if (!current || !q) return
    const k = cellIdToKey(current)
    if (k) writeCell(k, sub(cells[k] ?? ''))
    jump(1)
  }
  const replaceAll = () => {
    if (!q) return
    const keys: string[] = []
    for (const id of matches) {
      const k = cellIdToKey(id)
      if (k) keys.push(k)
    }
    if (keys.length === 0) return
    if (!regex && replaceCellText?.({ keys, search: q, replacement: r, caseSensitive })) return
    const jsonPath = rawCellTextJsonPath(q, { caseSensitive, regex })
    if (jsonPath && replaceCellsByQuery?.(jsonPath, sub)) return
    const writes: Writes = []
    for (const k of keys) writes.push([k, sub(cells[k] ?? '')])
    if (writes.length > 0) writeCells(writes)
  }

  return (
    <div {...rootProps} className="find-bar">
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); resetIdx() }}
        placeholder="찾기"
        aria-label="찾을 내용"
      />
      {mode === 'replace' && (
        <input
          value={r}
          onChange={(e) => setR(e.target.value)}
          placeholder="바꾸기"
          aria-label="바꿀 내용"
        />
      )}
      <label title="대소문자 구분"><input type="checkbox" checked={caseSensitive} onChange={(e) => { setCS(e.target.checked); resetIdx() }} aria-label="대소문자 구분" />Aa</label>
      <label title="정규식"><input type="checkbox" checked={regex} onChange={(e) => { setRegex(e.target.checked); resetIdx() }} aria-label="정규식 사용" />.*</label>
      <span className="count">{counter}</span>
      <button type="button" onClick={() => jump(-1)} disabled={matches.length === 0} title="이전 찾기 결과" aria-label="이전 찾기 결과">↑</button>
      <button type="button" onClick={() => jump(1)} disabled={matches.length === 0} title="다음 찾기 결과" aria-label="다음 찾기 결과">↓</button>
      {mode === 'replace' && (
        <>
          <button type="button" onClick={replaceOne} disabled={matches.length === 0} title="현재 찾기 결과 바꾸기" aria-label="현재 찾기 결과 바꾸기">바꾸기</button>
          <button type="button" onClick={replaceAll} disabled={matches.length === 0} title="모든 찾기 결과 바꾸기" aria-label="모든 찾기 결과 바꾸기">전체</button>
        </>
      )}
      <button type="button" onClick={onClose} title={`${dialogLabel} 닫기`} aria-label={`${dialogLabel} 닫기`}>✕</button>
    </div>
  )
}
