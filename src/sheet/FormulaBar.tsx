import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
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

const stopButtonActivationKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
  if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
}

export function FormulaBar({ addr, value, onCommit, onUndo, onRedo, canUndo, canRedo, extra, onAddrClick }: Props) {
  const [draftState, setDraftState] = useState({ addr, value, draft: value })
  const skipCommitOnBlur = useRef(false)
  const draft = draftState.addr === addr && draftState.value === value ? draftState.draft : value
  const setDraft = (next: string) => setDraftState({ addr, value, draft: next })
  const commitDraft = () => {
    if (draft !== value) onCommit(draft)
  }
  const canJumpToAddress = !!onAddrClick
  const addressLabel = canJumpToAddress ? (addr ? `${addr} 셀로 이동` : '셀 또는 범위로 이동') : addr ? `${addr} 셀 주소` : '선택된 셀 없음'
  const addressTitle = canJumpToAddress ? (addr ? '셀로 이동 (Ctrl/⌘+G)' : '셀 또는 범위로 이동 (Ctrl/⌘+G)') : addressLabel
  const formulaInputLabel = addr ? '수식 입력줄' : '수식 입력줄, 선택된 셀 없음'
  const formulaInputTitle = addr ? '수식 입력줄 (Enter=적용 / Esc=취소 / F4=참조 형식 순환)' : formulaInputLabel
  const undoLabel = canUndo ? '실행 취소' : '실행 취소할 작업 없음'
  const redoLabel = canRedo ? '다시 실행' : '다시 실행할 작업 없음'

  return (
    <header className="sheet-toolbar">
      <strong>Sheet</strong>
      <button
        type="button"
        className="addr"
        onClick={onAddrClick}
        title={addressTitle}
        aria-label={addressLabel}
        aria-keyshortcuts="Control+G Meta+G"
        disabled={!canJumpToAddress}
        onKeyDown={stopButtonActivationKeyDown}
      >{addr ?? '—'}</button>
      <input
        className="formula"
        aria-label={formulaInputLabel}
        aria-keyshortcuts="Enter Escape F4"
        title={formulaInputTitle}
        value={draft}
        onMouseDown={(e) => e.currentTarget.focus()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (skipCommitOnBlur.current) {
            skipCommitOnBlur.current = false
            return
          }
          commitDraft()
        }}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() }
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
      <button type="button" onClick={onUndo} onKeyDown={stopButtonActivationKeyDown} disabled={!canUndo} title={`${undoLabel} (Ctrl/⌘+Z)`} aria-keyshortcuts="Control+Z Meta+Z" aria-label={undoLabel}>실행 취소</button>
      <button type="button" onClick={onRedo} onKeyDown={stopButtonActivationKeyDown} disabled={!canRedo} title={`${redoLabel} (Ctrl/⌘+Shift+Z)`} aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z" aria-label={redoLabel}>다시 실행</button>
      {extra}
    </header>
  )
}
