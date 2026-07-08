import { useState, type KeyboardEvent } from 'react'
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

const stopControlActivationKeyDown = (event: KeyboardEvent<HTMLElement>) => {
  if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
}
const inputShortcutTitle = 'Enter=다음 결과 / Shift+Enter=이전 결과 / Esc=닫기'
const inputKeyShortcuts = 'Enter Shift+Enter Escape'

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
  const onTextInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation()
    if (event.key === 'Enter') {
      event.preventDefault()
      jump(event.shiftKey ? -1 : 1)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  if (!open) return null

  const counterLabel = !q ? undefined : matches.length === 0 ? '찾기 결과 없음' : `찾기 결과 ${counter}`
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
        onKeyDown={onTextInputKeyDown}
        placeholder="찾기"
        title={`찾을 내용 (${inputShortcutTitle})`}
        aria-label="찾을 내용"
        aria-keyshortcuts={inputKeyShortcuts}
      />
      {mode === 'replace' && (
        <input
          value={r}
          onChange={(e) => setR(e.target.value)}
          onKeyDown={onTextInputKeyDown}
          placeholder="바꾸기"
          title={`바꿀 내용 (${inputShortcutTitle})`}
          aria-label="바꿀 내용"
          aria-keyshortcuts={inputKeyShortcuts}
        />
      )}
      <label title="대소문자 구분"><input type="checkbox" checked={caseSensitive} onChange={(e) => { setCS(e.target.checked); resetIdx() }} onKeyDown={stopControlActivationKeyDown} aria-label="대소문자 구분" />Aa</label>
      <label title="정규식"><input type="checkbox" checked={regex} onChange={(e) => { setRegex(e.target.checked); resetIdx() }} onKeyDown={stopControlActivationKeyDown} aria-label="정규식 사용" />.*</label>
      <span className="count" role="status" aria-live="polite" aria-atomic="true" title={counterLabel} aria-label={counterLabel}>{counter}</span>
      <button type="button" onClick={() => jump(-1)} onKeyDown={stopControlActivationKeyDown} disabled={matches.length === 0} title="이전 찾기 결과 (Shift+Enter)" aria-label="이전 찾기 결과" aria-keyshortcuts="Shift+Enter">↑</button>
      <button type="button" onClick={() => jump(1)} onKeyDown={stopControlActivationKeyDown} disabled={matches.length === 0} title="다음 찾기 결과 (Enter)" aria-label="다음 찾기 결과" aria-keyshortcuts="Enter">↓</button>
      {mode === 'replace' && (
        <>
          <button type="button" onClick={replaceOne} onKeyDown={stopControlActivationKeyDown} disabled={matches.length === 0} title="현재 찾기 결과 바꾸기" aria-label="현재 찾기 결과 바꾸기">바꾸기</button>
          <button type="button" onClick={replaceAll} onKeyDown={stopControlActivationKeyDown} disabled={matches.length === 0} title="모든 찾기 결과 바꾸기" aria-label="모든 찾기 결과 바꾸기">전체</button>
        </>
      )}
      <button type="button" onClick={onClose} onKeyDown={stopControlActivationKeyDown} title={`${dialogLabel} 닫기 (Esc)`} aria-label={`${dialogLabel} 닫기`} aria-keyshortcuts="Escape">✕</button>
    </div>
  )
}
