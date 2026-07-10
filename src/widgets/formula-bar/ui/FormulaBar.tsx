import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cycleTrailingFormulaRef } from '@spredsheet/grid'
import { applyFormulaFunctionCompletion, type FormulaFunctionCompletion } from '@spredsheet/formula'
import { useFormulaAutocomplete } from '../../../features/formula-autocomplete/hooks/useFormulaAutocomplete'
import { FormulaAutocompleteList } from '../../../features/formula-autocomplete/ui/FormulaAutocompleteList'

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
  const [caretOffset, setCaretOffset] = useState(value.length)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const pendingCaretOffset = useRef<number | null>(null)
  const skipCommitOnBlur = useRef(false)
  const draft = draftState.addr === addr && draftState.value === value ? draftState.draft : value
  const setDraft = (next: string) => setDraftState({ addr, value, draft: next })
  const acceptCompletion = (completion: FormulaFunctionCompletion) => {
    const applied = applyFormulaFunctionCompletion(draft, completion)
    pendingCaretOffset.current = applied.caretOffset
    setCaretOffset(applied.caretOffset)
    setDraft(applied.formula)
  }
  const autocomplete = useFormulaAutocomplete({
    formula: draft,
    caretOffset,
    enabled: focused,
    onAccept: acceptCompletion,
  })
  useLayoutEffect(() => {
    const nextCaretOffset = pendingCaretOffset.current
    if (nextCaretOffset === null) return
    pendingCaretOffset.current = null
    inputRef.current?.focus({ preventScroll: true })
    inputRef.current?.setSelectionRange(nextCaretOffset, nextCaretOffset)
  }, [draft])
  const commitDraft = () => {
    if (draft !== value) onCommit(draft)
  }
  const canJumpToAddress = !!onAddrClick
  const addressLabel = canJumpToAddress ? (addr ? `${addr} 셀로 이동` : '셀 또는 범위로 이동') : addr ? `${addr} 셀 주소` : '선택된 셀 없음'
  const addressTitle = canJumpToAddress ? (addr ? '셀로 이동 (Ctrl/⌘+G)' : '셀 또는 범위로 이동 (Ctrl/⌘+G)') : addressLabel
  const addressKeyShortcuts = canJumpToAddress ? 'Control+G Meta+G' : undefined
  const formulaInputLabel = addr ? `${addr} 셀 수식 입력줄` : '수식 입력줄, 선택된 셀 없음'
  const formulaInputTitle = addr ? `${formulaInputLabel} (Enter=적용 / Esc=취소 / F4=참조 형식 순환)` : formulaInputLabel
  const formulaInputKeyShortcuts = addr ? 'Enter Escape F4' : undefined
  const undoLabel = canUndo ? '실행 취소' : '실행 취소할 작업 없음'
  const redoLabel = canRedo ? '다시 실행' : '다시 실행할 작업 없음'
  const undoTitle = canUndo ? `${undoLabel} (Ctrl/⌘+Z)` : undoLabel
  const redoTitle = canRedo ? `${redoLabel} (Ctrl/⌘+Shift+Z)` : redoLabel
  const undoKeyShortcuts = canUndo ? 'Control+Z Meta+Z' : undefined
  const redoKeyShortcuts = canRedo ? 'Control+Shift+Z Meta+Shift+Z' : undefined

  return (
    <header className="sheet-toolbar" role="toolbar" aria-label="스프레드시트 도구 모음">
      <strong>Sheet</strong>
      <button
        type="button"
        className="addr"
        onClick={onAddrClick}
        title={addressTitle}
        aria-label={addressLabel}
        aria-keyshortcuts={addressKeyShortcuts}
        disabled={!canJumpToAddress}
        onKeyDown={stopButtonActivationKeyDown}
      >{addr ?? '—'}</button>
      <div className="formula-editor">
        <input
          ref={inputRef}
          className="formula"
          aria-label={formulaInputLabel}
          aria-keyshortcuts={formulaInputKeyShortcuts}
          title={formulaInputTitle}
          value={draft}
          {...autocomplete.comboboxProps}
          onMouseDown={(e) => e.currentTarget.focus()}
          onFocus={(e) => {
            setFocused(true)
            setCaretOffset(e.currentTarget.selectionStart ?? draft.length)
          }}
          onSelect={(e) => setCaretOffset(e.currentTarget.selectionStart ?? draft.length)}
          onChange={(e) => {
            setDraft(e.target.value)
            setCaretOffset(e.currentTarget.selectionStart ?? e.target.value.length)
          }}
          onBlur={() => {
            setFocused(false)
            if (skipCommitOnBlur.current) {
              skipCommitOnBlur.current = false
              return
            }
            commitDraft()
          }}
          onKeyDown={(e) => {
            if (autocomplete.onKeyDown(e)) return
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
        <FormulaAutocompleteList autocomplete={autocomplete} />
      </div>
      <button type="button" onClick={onUndo} onKeyDown={stopButtonActivationKeyDown} disabled={!canUndo} title={undoTitle} aria-keyshortcuts={undoKeyShortcuts} aria-label={undoLabel}>실행 취소</button>
      <button type="button" onClick={onRedo} onKeyDown={stopButtonActivationKeyDown} disabled={!canRedo} title={redoTitle} aria-keyshortcuts={redoKeyShortcuts} aria-label={redoLabel}>다시 실행</button>
      {extra}
    </header>
  )
}
