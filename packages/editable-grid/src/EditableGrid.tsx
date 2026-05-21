import { useId, useMemo, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import {
  editableGridCellPath,
  editableGridProfileOf,
  editableGridRows,
  readJsonPointer,
  type EditableGridAddress,
  type EditableGridColumn,
  type EditableGridFieldType,
  type EditableGridHostContract,
  type EditableGridSelection,
} from './contract'
import {
  EditableGridCell,
  EditableGridColumnHeader,
  EditableGridInput,
  EditableGridRoot,
  EditableGridRow,
  EditableGridSelect,
  useEditableGridDomFocus,
  type EditableGridCaretMode,
} from './primitives'

export interface EditableGridRenderCell {
  readonly address: EditableGridAddress
  readonly column: EditableGridColumn
  readonly value: unknown
  readonly selected: boolean
  readonly editing: boolean
}

export interface EditableGridProps<TValue = unknown, TMeta = unknown> extends EditableGridHostContract<TValue, TMeta> {
  readonly className?: string
  readonly renderCell?: (cell: EditableGridRenderCell) => ReactNode
}

const formatCellValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

const sameAddress = (a: EditableGridAddress | undefined, b: EditableGridAddress): boolean =>
  !!a && a.rowIndex === b.rowIndex && a.columnId === b.columnId

const addressDomId = (address: EditableGridAddress): string =>
  `${address.rowIndex}:${address.columnId}`

const getEditableGridCellId = (element: HTMLElement): string | null =>
  element.dataset.editableGridCellId ?? null

const fieldTypeOf = (column: EditableGridColumn): EditableGridFieldType =>
  column.field?.type ?? 'text'

const optionLabel = (column: EditableGridColumn, value: unknown): string | null => {
  const key = String(value)
  const option = column.field?.options?.find((item) => item.value === key)
  return option ? option.label ?? option.value : null
}

const formatFieldValue = (value: unknown, column: EditableGridColumn): string => {
  const type = fieldTypeOf(column)
  if (type === 'select' || type === 'relation' || type === 'person') return optionLabel(column, value) ?? formatCellValue(value)
  if (type === 'multi-select' && Array.isArray(value)) {
    return value.map((item) => optionLabel(column, item) ?? formatCellValue(item)).filter(Boolean).join(', ')
  }
  return formatCellValue(value)
}

const isReadonlyColumn = (readonly: boolean | undefined, column: EditableGridColumn): boolean =>
  !!readonly || !!column.readonly || fieldTypeOf(column) === 'formula' || fieldTypeOf(column) === 'rollup'

const commitValueForField = (draft: string, column: EditableGridColumn): unknown => {
  const type = fieldTypeOf(column)
  if (type === 'number') {
    const next = Number(draft)
    return Number.isFinite(next) ? next : draft
  }
  if (type === 'checkbox') return draft === 'true'
  return draft
}

const checkedValue = (value: unknown): boolean =>
  value === true || value === 'true' || value === 'TRUE' || value === 1

export function EditableGrid<TValue = unknown, TMeta = unknown>({
  surface,
  value,
  selection,
  readonly,
  onChange,
  onSelectionChange,
  className,
  renderCell,
}: EditableGridProps<TValue, TMeta>) {
  const gridId = useId()
  const profile = editableGridProfileOf(surface)
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
    setSelection({ focus: address, ranges: [{ anchor: address, focus: address }] })
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
    const nextSelection = { focus: address, ranges: [{ anchor: address, focus: address }] }
    const value = commitValueForField(draft, column)
    if (opts.restoreFocus) domFocus.requestCellFocusRestore(addressDomId(address))
    onChange({
      patches: [{
        op: previousValue === undefined ? 'add' : 'replace',
        path: editableGridCellPath(surface.dataPath, address.rowIndex, column.path),
        value,
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
    const nextSelection = { focus: address, ranges: [{ anchor: address, focus: address }] }
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
    focusCell({ rowIndex: nextRow, columnId: nextColumn.id })
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

  return (
    <EditableGridRoot
      id={gridId}
      profile={profile}
      rowCount={rows.length + 1}
      colCount={surface.columns.length}
      className={className}
    >
      <EditableGridRow header>
        {surface.columns.map((column, columnIndex) => (
          <EditableGridColumnHeader key={column.id} colIndex={columnIndex + 1}>
            {column.label ?? column.id}
          </EditableGridColumnHeader>
        ))}
      </EditableGridRow>
      {rows.map((row, rowIndex) => (
        <EditableGridRow key={rowIndex} rowIndex={rowIndex + 2}>
          {surface.columns.map((column, columnIndex) => {
            const address = { rowIndex, columnId: column.id }
            const cellValue = readJsonPointer(row, column.path)
            const selected = sameAddress(activeSelection.focus, address)
            const isEditing = sameAddress(editing ?? undefined, address)
            const fieldType = fieldTypeOf(column)
            return (
              <EditableGridCell
                key={column.id}
                cellId={addressDomId(address)}
                colIndex={columnIndex + 1}
                selected={selected}
                editing={isEditing}
                focusable={selected || (!activeSelection.focus && rowIndex === 0 && columnIndex === 0)}
                onFocus={() => focusCell(address)}
                onClick={() => focusCell(address)}
                onDoubleClick={() => startEdit(address, cellValue, column, { caret: 'end' })}
                onKeyDown={(event) => onCellKeyDown(event, address, cellValue, column)}
              >
                {isEditing ? (
                  fieldType === 'select' ? (
                    <EditableGridSelect
                      aria-label={`${column.label ?? column.id} 편집`}
                      value={draft}
                      ref={domFocus.editorRef}
                      onChange={(event) => setDraft(event.currentTarget.value)}
                      onBlur={() => commitEdit(address, cellValue, column)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') { event.preventDefault(); commitEdit(address, cellValue, column, { restoreFocus: true }) }
                        else if (event.key === 'Escape') { event.preventDefault(); cancelEdit(address, { restoreFocus: true }) }
                      }}
                    >
                      <option value="">-</option>
                      {column.field?.options?.map((option) => (
                        <option key={option.value} value={option.value}>{option.label ?? option.value}</option>
                      ))}
                    </EditableGridSelect>
                  ) : (
                    <EditableGridInput
                      aria-label={`${column.label ?? column.id} 편집`}
                      type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                      value={draft}
                      ref={domFocus.editorRef}
                      onChange={(event) => setDraft(event.currentTarget.value)}
                      onBlur={() => commitEdit(address, cellValue, column)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') { event.preventDefault(); commitEdit(address, cellValue, column, { restoreFocus: true }) }
                        else if (event.key === 'Escape') { event.preventDefault(); cancelEdit(address, { restoreFocus: true }) }
                      }}
                    />
                  )
                ) : fieldType === 'checkbox' ? (
                  <input
                    type="checkbox"
                    aria-label={column.label ?? column.id}
                    checked={checkedValue(cellValue)}
                    disabled={isReadonlyColumn(readonly, column)}
                    onChange={() => commitDirectValue(address, cellValue, column, !checkedValue(cellValue))}
                    onClick={(event) => event.stopPropagation()}
                  />
                ) : renderCell ? (
                  renderCell({ address, column, value: cellValue, selected, editing: false })
                ) : (
                  formatFieldValue(cellValue, column)
                )}
              </EditableGridCell>
            )
          })}
        </EditableGridRow>
      ))}
    </EditableGridRoot>
  )
}
