import { useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  editableGridCellPath,
  editableGridRows,
  type EditableGridAddress,
  type EditableGridColumn,
  type EditableGridHostContract,
  type EditableGridSelection,
} from './contract'
import { useEditableGridDomFocus, type EditableGridCaretMode } from './primitives'
import {
  addressDomId,
  checkedValue,
  commitValueForField,
  fieldTypeOf,
  formatCellValue,
  getEditableGridCellId,
  isReadonlyColumn,
  sameAddress,
} from './editableGridFieldModel'
import { addressIsInGrid, extendedSelectionForAddress, selectionForAddress } from './editableGridSelectionModel'

export type UseEditableGridControllerArgs<TValue = unknown, TMeta = unknown> =
  EditableGridHostContract<TValue, TMeta>

const sameOptionalAddress = (
  left: EditableGridAddress | undefined,
  right: EditableGridAddress | undefined,
): boolean =>
  left === undefined && right === undefined
    ? true
    : !!left && !!right && sameAddress(left, right)

const sameSelection = (left: EditableGridSelection, right: EditableGridSelection): boolean => {
  if (!sameOptionalAddress(left.focus, right.focus)) return false
  const leftRanges = left.ranges ?? []
  const rightRanges = right.ranges ?? []
  return leftRanges.length === rightRanges.length
    && leftRanges.every((range, index) => {
      const other = rightRanges[index]
      return !!other && sameAddress(range.anchor, other.anchor) && sameAddress(range.focus, other.focus)
    })
}

export function useEditableGridController<TValue = unknown, TMeta = unknown>({
  surface,
  value,
  selection,
  readonly,
  onChange,
  onSelectionChange,
}: UseEditableGridControllerArgs<TValue, TMeta>) {
  const rows = useMemo(() => editableGridRows(value, surface.dataPath), [surface.dataPath, value])
  const [localSelection, setLocalSelection] = useState<EditableGridSelection>({})
  const [editing, setEditing] = useState<EditableGridAddress | null>(null)
  const [draft, setDraft] = useState('')
  const activeSelection = selection ?? localSelection
  const domFocus = useEditableGridDomFocus({
    editingId: editing ? addressDomId(editing) : null,
    activeId: activeSelection.focus ? addressDomId(activeSelection.focus) : null,
    cellSelector: '[role="gridcell"][data-editable-grid-cell-id]',
    getCellId: getEditableGridCellId,
  })

  const setSelection = (next: EditableGridSelection) => {
    if (sameSelection(activeSelection, next)) return
    if (!selection) setLocalSelection(next)
    onSelectionChange?.(next)
  }

  const focusCell = (address: EditableGridAddress, opts: { extend?: boolean } = {}) => {
    setSelection(opts.extend
      ? extendedSelectionForAddress(activeSelection, address, surface.columns, rows.length)
      : selectionForAddress(address))
  }

  const syncDomFocus = (address: EditableGridAddress) => {
    if (addressIsInGrid(activeSelection.focus, surface.columns, rows.length)) return
    focusCell(address)
  }

  const focusCellWithDomFocus = (address: EditableGridAddress, opts: { extend?: boolean } = {}) => {
    domFocus.requestCellFocusRestore(addressDomId(address))
    focusCell(address, opts)
  }

  const startEdit = (
    address: EditableGridAddress,
    cellValue: unknown,
    column: EditableGridColumn,
    opts: { caret?: EditableGridCaretMode } = {},
  ) => {
    if (isReadonlyColumn(readonly, column) || fieldTypeOf(column) === 'checkbox') return
    focusCell(address)
    domFocus.requestEditorCaret(opts.caret)
    setEditing(address)
    setDraft(formatCellValue(cellValue))
  }

  const commitEdit = (
    address: EditableGridAddress,
    previousValue: unknown,
    column: EditableGridColumn,
    opts: { restoreFocus?: boolean } = {},
  ) => {
    const nextSelection = selectionForAddress(address)
    const committedValue = commitValueForField(draft, column)
    if (opts.restoreFocus) domFocus.requestCellFocusRestore(addressDomId(address))
    if (Object.is(previousValue, committedValue)) {
      setSelection(nextSelection)
      setEditing(null)
      return
    }
    onChange({
      patches: [{
        op: previousValue === undefined ? 'add' : 'replace',
        path: editableGridCellPath(surface.dataPath, address.rowIndex, column.path),
        value: committedValue,
      }],
      source: 'cell-edit',
      selection: nextSelection,
    })
    setSelection(nextSelection)
    setEditing(null)
  }

  const cancelEdit = (address: EditableGridAddress, opts: { restoreFocus?: boolean } = {}) => {
    if (opts.restoreFocus) domFocus.requestCellFocusRestore(addressDomId(address))
    setEditing(null)
  }

  const commitDirectValue = (
    address: EditableGridAddress,
    previousValue: unknown,
    column: EditableGridColumn,
    nextValue: unknown,
  ) => {
    const nextSelection = selectionForAddress(address)
    onChange({
      patches: [{
        op: previousValue === undefined ? 'add' : 'replace',
        path: editableGridCellPath(surface.dataPath, address.rowIndex, column.path),
        value: nextValue,
      }],
      source: 'cell-edit',
      selection: nextSelection,
    })
    setSelection(nextSelection)
  }

  const moveFocus = (address: EditableGridAddress, dRow: number, dCol: number, extend = false) => {
    const currentCol = surface.columns.findIndex((column) => column.id === address.columnId)
    const nextRow = Math.max(0, Math.min(rows.length - 1, address.rowIndex + dRow))
    const nextCol = Math.max(0, Math.min(surface.columns.length - 1, currentCol + dCol))
    const nextColumn = surface.columns[nextCol]
    if (!nextColumn) return
    const nextAddress = { rowIndex: nextRow, columnId: nextColumn.id }
    if (nextAddress.rowIndex === address.rowIndex && nextAddress.columnId === address.columnId) return
    focusCellWithDomFocus(nextAddress, { extend })
  }

  const onCellKeyDown = (
    event: KeyboardEvent,
    address: EditableGridAddress,
    cellValue: unknown,
    column: EditableGridColumn,
  ) => {
    if (fieldTypeOf(column) === 'checkbox' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      event.stopPropagation()
      if (!isReadonlyColumn(readonly, column)) {
        commitDirectValue(address, cellValue, column, !checkedValue(cellValue))
      }
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      startEdit(address, cellValue, column, { caret: 'end' })
      return
    }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveFocus(address, -1, 0, event.shiftKey) }
    else if (event.key === 'ArrowDown') { event.preventDefault(); moveFocus(address, 1, 0, event.shiftKey) }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); moveFocus(address, 0, -1, event.shiftKey) }
    else if (event.key === 'ArrowRight') { event.preventDefault(); moveFocus(address, 0, 1, event.shiftKey) }
  }

  return {
    rows,
    activeSelection,
    editing,
    draft,
    setDraft,
    domFocus,
    focusCell,
    syncDomFocus,
    focusCellWithDomFocus,
    startEdit,
    commitEdit,
    cancelEdit,
    commitDirectValue,
    onCellKeyDown,
  }
}
