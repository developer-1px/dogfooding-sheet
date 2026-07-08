import { useId } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import {
  editableGridProfileOf,
  readJsonPointer,
  type EditableGridAddress,
  type EditableGridColumn,
  type EditableGridHostContract,
} from './contract'
import {
  EditableGridCell,
  EditableGridColumnHeader,
  EditableGridInput,
  EditableGridRoot,
  EditableGridRow,
  EditableGridSelect,
} from './primitives'
import { useEditableGridController } from './useEditableGridController'
import {
  addressDomId,
  checkedValue,
  fieldTypeOf,
  formatFieldValue,
  isReadonlyColumn,
  sameAddress,
} from './editableGridFieldModel'

export interface EditableGridRenderCell {
  readonly address: EditableGridAddress
  readonly column: EditableGridColumn
  readonly value: unknown
  readonly selected: boolean
  readonly editing: boolean
}

export interface EditableGridProps<TValue = unknown, TMeta = unknown> extends EditableGridHostContract<TValue, TMeta> {
  readonly className?: string
  readonly ariaLabel?: string
  readonly renderCell?: (cell: EditableGridRenderCell) => ReactNode
}

export function EditableGrid<TValue = unknown, TMeta = unknown>({
  surface,
  value,
  selection,
  readonly,
  onChange,
  onSelectionChange,
  className,
  ariaLabel = 'Editable grid',
  renderCell,
}: EditableGridProps<TValue, TMeta>) {
  const gridId = useId()
  const profile = editableGridProfileOf(surface)
  const controller = useEditableGridController({
    surface,
    value,
    selection,
    readonly,
    onChange,
    onSelectionChange,
  })

  return (
    <EditableGridRoot
      id={gridId}
      profile={profile}
      rowCount={controller.rows.length + 1}
      colCount={surface.columns.length}
      className={className}
      aria-label={ariaLabel}
    >
      <EditableGridRow header>
        {surface.columns.map((column, columnIndex) => (
          <EditableGridColumnHeader key={column.id} colIndex={columnIndex + 1}>
            {column.label ?? column.id}
          </EditableGridColumnHeader>
        ))}
      </EditableGridRow>
      {controller.rows.map((row, rowIndex) => (
        <EditableGridRow key={rowIndex} rowIndex={rowIndex + 2}>
          {surface.columns.map((column, columnIndex) => {
            const address = { rowIndex, columnId: column.id }
            const cellValue = readJsonPointer(row, column.path)
            const selected = sameAddress(controller.activeSelection.focus, address)
            const isEditing = sameAddress(controller.editing ?? undefined, address)
            const fieldType = fieldTypeOf(column)
            const onEditorKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
              event.stopPropagation()
              if (event.key === 'Enter') {
                event.preventDefault()
                controller.commitEdit(address, cellValue, column, { restoreFocus: true })
                return
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                controller.cancelEdit(address, { restoreFocus: true })
              }
            }
            return (
              <EditableGridCell
                key={column.id}
                cellId={addressDomId(address)}
                colIndex={columnIndex + 1}
                selected={selected}
                editing={isEditing}
                focusable={selected || (!controller.activeSelection.focus && rowIndex === 0 && columnIndex === 0)}
                onFocus={() => controller.focusCell(address)}
                onClick={() => controller.focusCell(address)}
                onDoubleClick={() => controller.startEdit(address, cellValue, column, { caret: 'end' })}
                onKeyDown={(event) => controller.onCellKeyDown(event, address, cellValue, column)}
              >
                {isEditing ? (
                  fieldType === 'select' ? (
                    <EditableGridSelect
                      aria-label={`${column.label ?? column.id} 편집`}
                      value={controller.draft}
                      ref={controller.domFocus.editorRef}
                      onChange={(event) => controller.setDraft(event.currentTarget.value)}
                      onBlur={() => controller.commitEdit(address, cellValue, column)}
                      onKeyDown={onEditorKeyDown}
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
                      value={controller.draft}
                      ref={controller.domFocus.editorRef}
                      onChange={(event) => controller.setDraft(event.currentTarget.value)}
                      onBlur={() => controller.commitEdit(address, cellValue, column)}
                      onKeyDown={onEditorKeyDown}
                    />
                  )
                ) : fieldType === 'checkbox' ? (
                  <input
                    type="checkbox"
                    aria-label={column.label ?? column.id}
                    checked={checkedValue(cellValue)}
                    disabled={isReadonlyColumn(readonly, column)}
                    onChange={() => controller.commitDirectValue(address, cellValue, column, !checkedValue(cellValue))}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
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
