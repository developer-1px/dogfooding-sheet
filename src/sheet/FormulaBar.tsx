import { useRef, useState, type ReactNode } from 'react'
import { cycleTrailingFormulaRef } from './selection/formulaPick'

interface Props {
  addr: string | null
  value: string
  onCommit: (v: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  extra?: ReactNode
  onAddrClick?: () => void
}

export function FormulaBar({ addr, value, onCommit, onUndo, onRedo, canUndo, canRedo, extra, onAddrClick }: Props) {
  const [draftState, setDraftState] = useState({ addr, value, draft: value })
  const skipCommitOnBlur = useRef(false)
  const draft = draftState.addr === addr && draftState.value === value ? draftState.draft : value
  const setDraft = (next: string) => setDraftState({ addr, value, draft: next })

  return (
    <header className="sheet-toolbar">
      <strong>Sheet</strong>
      <button
        type="button"
        className="addr"
        onClick={onAddrClick}
        title="셀로 이동 (Ctrl/⌘+G)"
        disabled={!onAddrClick}
      >{addr ?? '—'}</button>
      <input
        className="formula"
        value={draft}
        onMouseDown={(e) => e.currentTarget.focus()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (skipCommitOnBlur.current) {
            skipCommitOnBlur.current = false
            return
          }
          onCommit(draft)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.currentTarget.blur() }
          else if (e.key === 'Escape') {
            skipCommitOnBlur.current = true
            setDraft(value)
            e.currentTarget.blur()
          }
          else if (e.key === 'F4' && draft.startsWith('=')) { e.preventDefault(); setDraft(cycleTrailingFormulaRef(draft)) }
        }}
        placeholder="값 또는 =A1+B1"
        disabled={!addr}
      />
      <button onClick={onUndo} disabled={!canUndo}>Undo</button>
      <button onClick={onRedo} disabled={!canRedo}>Redo</button>
      {extra}
    </header>
  )
}
