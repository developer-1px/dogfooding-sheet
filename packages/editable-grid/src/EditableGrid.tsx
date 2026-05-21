import { useId, useMemo, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import {
  editableGridCellPath,
  editableGridProfileOf,
  editableGridRows,
  readJsonPointer,
  type EditableGridAddress,
  type EditableGridColumn,
  type EditableGridHostContract,
  type EditableGridSelection,
} from './contract'

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

  const setSelection = (next: EditableGridSelection) => {
    if (!selection) setLocalSelection(next)
    onSelectionChange?.(next)
  }

  const focusCell = (address: EditableGridAddress) => {
    setSelection({ focus: address, ranges: [{ anchor: address, focus: address }] })
  }

  const startEdit = (address: EditableGridAddress, cellValue: unknown, column: EditableGridColumn) => {
    if (readonly || column.readonly) return
    focusCell(address)
    setEditing(address)
    setDraft(formatCellValue(cellValue))
  }

  const commitEdit = (address: EditableGridAddress, previousValue: unknown, column: EditableGridColumn) => {
    const nextSelection = { focus: address, ranges: [{ anchor: address, focus: address }] }
    onChange({
      patches: [{
        op: previousValue === undefined ? 'add' : 'replace',
        path: editableGridCellPath(surface.dataPath, address.rowIndex, column.path),
        value: draft,
      }],
      source: 'cell-edit',
      selection: nextSelection,
    })
    setSelection(nextSelection)
    setEditing(null)
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
      startEdit(address, cellValue, column)
      return
    }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveFocus(address, -1, 0) }
    else if (event.key === 'ArrowDown') { event.preventDefault(); moveFocus(address, 1, 0) }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); moveFocus(address, 0, -1) }
    else if (event.key === 'ArrowRight') { event.preventDefault(); moveFocus(address, 0, 1) }
  }

  return (
    <div
      id={gridId}
      role="grid"
      aria-rowcount={rows.length + 1}
      aria-colcount={surface.columns.length}
      data-editable-grid-profile={profile}
      className={['editable-grid', `editable-grid--${profile}`, className].filter(Boolean).join(' ')}
    >
      <div role="row" className="editable-grid-row editable-grid-header-row">
        {surface.columns.map((column, columnIndex) => (
          <div key={column.id} role="columnheader" aria-colindex={columnIndex + 1} className="editable-grid-header-cell">
            {column.label ?? column.id}
          </div>
        ))}
      </div>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} role="row" aria-rowindex={rowIndex + 2} className="editable-grid-row">
          {surface.columns.map((column, columnIndex) => {
            const address = { rowIndex, columnId: column.id }
            const cellValue = readJsonPointer(row, column.path)
            const selected = sameAddress(activeSelection.focus, address)
            const isEditing = sameAddress(editing ?? undefined, address)
            return (
              <div
                key={column.id}
                role="gridcell"
                aria-colindex={columnIndex + 1}
                aria-selected={selected}
                tabIndex={selected || (!activeSelection.focus && rowIndex === 0 && columnIndex === 0) ? 0 : -1}
                className={['editable-grid-cell', selected ? 'selected' : '', isEditing ? 'editing' : ''].filter(Boolean).join(' ')}
                onFocus={() => focusCell(address)}
                onClick={() => focusCell(address)}
                onDoubleClick={() => startEdit(address, cellValue, column)}
                onKeyDown={(event) => onCellKeyDown(event, address, cellValue, column)}
              >
                {isEditing ? (
                  <input
                    className="editable-grid-input"
                    aria-label={`${column.label ?? column.id} 편집`}
                    value={draft}
                    autoFocus
                    onChange={(event) => setDraft(event.currentTarget.value)}
                    onBlur={() => commitEdit(address, cellValue, column)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') { event.preventDefault(); commitEdit(address, cellValue, column) }
                      else if (event.key === 'Escape') { event.preventDefault(); setEditing(null) }
                    }}
                  />
                ) : renderCell ? (
                  renderCell({ address, column, value: cellValue, selected, editing: false })
                ) : (
                  formatCellValue(cellValue)
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
