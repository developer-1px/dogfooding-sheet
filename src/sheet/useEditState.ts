import { useCallback, useMemo, useState } from 'react'
import { useEditableGridDomFocus, type EditableGridCaretMode } from '@spredsheet/editable-grid/primitives'
import {
  cancelGridEdit,
  commitGridEdit,
  createGridEditState,
  moveCellIdByDelta,
  setGridDraft,
  setGridFocus,
  startGridEdit,
  type GridNavDir,
} from '@spredsheet/grid'
import { cellKey, parseCellId, type WriteCell, type Cells } from './schema'

interface Args {
  cells: Cells
  writeCell: WriteCell
  rowCount: number
  colLetters: readonly string[]
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onKeyDown'> & {
  ref?: React.Ref<HTMLInputElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>
}
type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onKeyDown'> & {
  ref?: React.Ref<HTMLSelectElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>
}
type CommitOptions = { restoreFocus?: boolean; draft?: string }

const dirDelta: Record<GridNavDir, { dRow: number; dCol: number }> = {
  down: { dRow: 1, dCol: 0 },
  up: { dRow: -1, dCol: 0 },
  right: { dRow: 0, dCol: 1 },
  left: { dRow: 0, dCol: -1 },
}

export function useEditState({ cells, writeCell, rowCount, colLetters }: Args) {
  const [state, setState] = useState(() => createGridEditState<string>('r0-A'))
  const { editorRef, requestEditorCaret, requestCellFocusRestore } = useEditableGridDomFocus({
    editingId: state.editing,
    activeId: state.focusId,
  })

  const getValue = useCallback((id: string) => {
    const p = parseCellId(id)
    return p ? cells[cellKey(p.col, p.row)] ?? '' : ''
  }, [cells])

  const navigate = useCallback((id: string, dir: GridNavDir) => {
    const { dRow, dCol } = dirDelta[dir]
    return moveCellIdByDelta(id, dRow, dCol, { rowCount, colLetters })
  }, [colLetters, rowCount])

  const setFocusId = useCallback((id: string | null) => setState((s) => setGridFocus(s, id)), [])
  const setDraft = useCallback((draft: string) => setState((s) => setGridDraft(s, draft)), [])

  const startEdit = useCallback((id: string, initial?: string, opts?: { caret?: EditableGridCaretMode }) => {
    const started = startGridEdit(state, id, initial ?? getValue(id), opts)
    requestEditorCaret(started.caret)
    setState(started.state)
  }, [getValue, requestEditorCaret, state])

  const cancelEdit = useCallback((opts: CommitOptions = {}) => setState((s) => {
    const canceled = cancelGridEdit(s)
    if (opts.restoreFocus && s.editing !== null) requestCellFocusRestore(canceled.focusId)
    return canceled
  }), [requestCellFocusRestore])

  // Keep the existing sheet-level commitEdit({ dRow, dCol }) API while using the package edit engine.
  const commitEdit = useCallback((move?: { dRow: number; dCol: number }, opts: CommitOptions = {}) => setState((s) => {
    const dir = !move ? undefined : move.dRow > 0 ? 'down' : move.dRow < 0 ? 'up' : move.dCol > 0 ? 'right' : 'left'
    const editState = opts.draft === undefined ? s : setGridDraft(s, opts.draft)
    const committed = commitGridEdit(editState, dir ? (id) => navigate(id, dir) : undefined)
    if (opts.restoreFocus && s.editing !== null) requestCellFocusRestore(committed.state.focusId)
    if (committed.write) {
      const p = parseCellId(committed.write.id)
      if (p) writeCell(cellKey(p.col, p.row), committed.write.value)
    }
    return committed.state
  }), [navigate, requestCellFocusRestore, writeCell])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit(undefined, { restoreFocus: true })
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit({ restoreFocus: true })
    }
  }, [cancelEdit, commitEdit])

  const inputProps = useMemo<InputProps>(() => ({
    ref: editorRef,
    value: state.draft,
    onChange: (e) => setDraft(e.currentTarget.value),
    onKeyDown,
    onBlur: () => commitEdit(),
  }), [commitEdit, editorRef, onKeyDown, setDraft, state.draft])

  const selectProps = useMemo<SelectProps>(() => ({
    ref: editorRef,
    value: state.draft,
    onChange: (e) => setDraft(e.currentTarget.value),
    onKeyDown,
    onBlur: () => commitEdit(),
  }), [commitEdit, editorRef, onKeyDown, setDraft, state.draft])

  const focusCell = state.focusId ? parseCellId(state.focusId) : null
  const focusKey = focusCell ? cellKey(focusCell.col, focusCell.row) : null

  return {
    focusId: state.focusId,
    setFocusId,
    editing: state.editing,
    draft: state.draft,
    setDraft,
    startEdit,
    commitEdit,
    cancelEdit,
    inputProps,
    selectProps,
    focusKey,
  }
}
