import type {
  EditableGridAddress,
  EditableGridColumn,
  EditableGridFieldType,
} from './contract'

export const formatCellValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

export const sameAddress = (a: EditableGridAddress | undefined, b: EditableGridAddress): boolean =>
  !!a && a.rowIndex === b.rowIndex && a.columnId === b.columnId

export const addressDomId = (address: EditableGridAddress): string =>
  `${address.rowIndex}:${address.columnId}`

export const getEditableGridCellId = (element: HTMLElement): string | null =>
  element.dataset.editableGridCellId ?? null

export const fieldTypeOf = (column: EditableGridColumn): EditableGridFieldType =>
  column.field?.type ?? 'text'

const optionLabel = (column: EditableGridColumn, value: unknown): string | null => {
  const key = String(value)
  const option = column.field?.options?.find((item) => item.value === key)
  return option ? option.label ?? option.value : null
}

export const formatFieldValue = (value: unknown, column: EditableGridColumn): string => {
  const type = fieldTypeOf(column)
  if (type === 'select' || type === 'relation' || type === 'person') return optionLabel(column, value) ?? formatCellValue(value)
  if (type === 'multi-select' && Array.isArray(value)) {
    return value.map((item) => optionLabel(column, item) ?? formatCellValue(item)).filter(Boolean).join(', ')
  }
  return formatCellValue(value)
}

export const isReadonlyColumn = (readonly: boolean | undefined, column: EditableGridColumn): boolean =>
  !!readonly || !!column.readonly || fieldTypeOf(column) === 'formula' || fieldTypeOf(column) === 'rollup'

export const commitValueForField = (draft: string, column: EditableGridColumn): unknown => {
  const type = fieldTypeOf(column)
  if (type === 'number') {
    const next = Number(draft)
    return Number.isFinite(next) ? next : draft
  }
  if (type === 'checkbox') return draft === 'true'
  return draft
}

export const checkedValue = (value: unknown): boolean =>
  value === true || value === 'true' || value === 'TRUE' || value === 1
