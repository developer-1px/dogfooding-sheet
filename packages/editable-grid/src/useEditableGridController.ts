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
  commitValueForField,
  fieldTypeOf,
  formatCellValue,
  getEditableGridCellId,
  isReadonlyColumn,
  sameAddress,
} from './editableGridFieldModel'

export type UseEditableGridControllerArgs<TValue = unknown, TMeta = unknown> =
  EditableGridHostContract<TValue, TMeta>

const selectionForAddress = (address: EditableGridAddress): EditableGridSelection => ({
  focus: address,
  ranges: [{ anchor: address, focus: address }],
})

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
    if (!selection) setLocalSelection(next)
    onSelectionChange?.(next)
  }

  const focusCell = (address: EditableGridAddress) => {
    if (sameAddress(activeSelection.focus, address)) return
    setSelection(selectionForAddress(address))
  }

  const focusCellWithDomFocus = (address: EditableGridAddress) => {
    domFocus.requestCellFocusRestore(addressDomId(address))
    focusCell(address)
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

  const moveFocus = (address: EditableGridAddress, dRow: number, dCol: number) => {
    const currentCol = surface.columns.findIndex((column) => column.id === address.columnId)
    const nextRow = Math.max(0, Math.min(rows.length - 1, address.rowIndex + dRow))
    const nextCol = Math.max(0, Math.min(surface.columns.length - 1, currentCol + dCol))
    const nextColumn = surface.columns[nextCol]
    if (!nextColumn) return
    const nextAddress = { rowIndex: nextRow, columnId: nextColumn.id }
    if (nextAddress.rowIndex === address.rowIndex && nextAddress.columnId === address.columnId) return
    focusCellWithDomFocus(nextAddress)
  }

  const onCellKeyDown = (
    event: KeyboardEvent,
    address: EditableGridAddress,
    cellValue: unknown,
    column: EditableGridColumn,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      startEdit(address, cellValue, column, { caret: 'end' })
      return
    }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveFocus(address, -1, 0) }
    else if (event.key === 'ArrowDown') { event.preventDefault(); moveFocus(address, 1, 0) }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); moveFocus(address, 0, -1) }
    else if (event.key === 'ArrowRight') { event.preventDefault(); moveFocus(address, 0, 1) }
  }

  return {
    rows,
    activeSelection,
    editing,
    draft,
    setDraft,
    domFocus,
    focusCell,
    focusCellWithDomFocus,
    startEdit,
    commitEdit,
    cancelEdit,
    commitDirectValue,
    onCellKeyDown,
  }
}
