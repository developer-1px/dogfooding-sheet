import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  cancelGridEdit,
  commitGridEdit,
  createGridEditState,
  moveCellIdByDelta,
  setGridDraft,
  setGridFocus,
  startGridEdit,
  type GridCaretMode,
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

const dirDelta: Record<GridNavDir, { dRow: number; dCol: number }> = {
  down: { dRow: 1, dCol: 0 },
  up: { dRow: -1, dCol: 0 },
  right: { dRow: 0, dCol: 1 },
  left: { dRow: 0, dCol: -1 },
}

export function useEditState({ cells, writeCell, rowCount, colLetters }: Args) {
  const [state, setState] = useState(() => createGridEditState<string>('r0-A'))
  const inputRef = useRef<HTMLInputElement | null>(null)
  const selectRef = useRef<HTMLSelectElement | null>(null)

  const getValue = useCallback((id: string) => {
    const p = parseCellId(id)
    return p ? cells[cellKey(p.col, p.row)] ?? '' : ''
  }, [cells])

  const navigate = useCallback((id: string, dir: GridNavDir) => {
    const { dRow, dCol } = dirDelta[dir]
    return moveCellIdByDelta(id, dRow, dCol, { rowCount, colLetters })
  }, [colLetters, rowCount])

  useEffect(() => {
    if (state.editing === null) return
    const el = inputRef.current ?? selectRef.current
    el?.focus()
    if (el instanceof HTMLInputElement) el.select()
  }, [state.editing])

  const applyCaret = (caret?: GridCaretMode) => {
    if (!caret) return
    queueMicrotask(() => {
      const input = inputRef.current
      if (!input) return
      if (caret === 'select-all') input.select()
      else if (caret === 'start') input.setSelectionRange(0, 0)
      else input.setSelectionRange(input.value.length, input.value.length)
    })
  }

  const setFocusId = useCallback((id: string | null) => setState((s) => setGridFocus(s, id)), [])
  const setDraft = useCallback((draft: string) => setState((s) => setGridDraft(s, draft)), [])

  const startEdit = useCallback((id: string, initial?: string, opts?: { caret?: GridCaretMode }) => {
    const started = startGridEdit(state, id, initial ?? getValue(id), opts)
    setState(started.state)
    applyCaret(started.caret)
  }, [getValue, state])

  const cancelEdit = useCallback(() => setState((s) => cancelGridEdit(s)), [])

  // Keep the existing sheet-level commitEdit({ dRow, dCol }) API while using the package edit engine.
  const commitEdit = useCallback((move?: { dRow: number; dCol: number }) => setState((s) => {
    const dir = !move ? undefined : move.dRow > 0 ? 'down' : move.dRow < 0 ? 'up' : move.dCol > 0 ? 'right' : 'left'
    const committed = commitGridEdit(s, dir ? (id) => navigate(id, dir) : undefined)
    if (committed.write) {
      const p = parseCellId(committed.write.id)
      if (p) writeCell(cellKey(p.col, p.row), committed.write.value)
    }
    return committed.state
  }), [navigate, writeCell])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }, [cancelEdit, commitEdit])

  const inputProps = useMemo<InputProps>(() => ({
    ref: inputRef,
    value: state.draft,
    onChange: (e) => setDraft(e.currentTarget.value),
    onKeyDown,
    onBlur: () => commitEdit(),
  }), [commitEdit, onKeyDown, setDraft, state.draft])

  const selectProps = useMemo<SelectProps>(() => ({
    ref: selectRef,
    value: state.draft,
    onChange: (e) => setDraft(e.currentTarget.value),
    onKeyDown,
    onBlur: () => commitEdit(),
  }), [commitEdit, onKeyDown, setDraft, state.draft])

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
