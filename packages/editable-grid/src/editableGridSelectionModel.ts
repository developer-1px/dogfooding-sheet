import type {
  EditableGridAddress,
  EditableGridColumn,
  EditableGridRange,
  EditableGridSelection,
} from './contract'

const columnIndexOf = (columns: readonly EditableGridColumn[], columnId: string): number =>
  columns.findIndex((column) => column.id === columnId)

export const addressIsInGrid = (
  address: EditableGridAddress | undefined,
  columns: readonly EditableGridColumn[],
  rowCount: number,
): address is EditableGridAddress =>
  !!address
  && Number.isInteger(address.rowIndex)
  && address.rowIndex >= 0
  && address.rowIndex < rowCount
  && columnIndexOf(columns, address.columnId) >= 0

const validRange = (
  range: EditableGridRange,
  columns: readonly EditableGridColumn[],
  rowCount: number,
): boolean =>
  addressIsInGrid(range.anchor, columns, rowCount)
  && addressIsInGrid(range.focus, columns, rowCount)

export const selectionForAddress = (address: EditableGridAddress): EditableGridSelection => ({
  focus: address,
  ranges: [{ anchor: address, focus: address }],
})

export function extendedSelectionForAddress(
  selection: EditableGridSelection,
  focus: EditableGridAddress,
  columns: readonly EditableGridColumn[],
  rowCount: number,
): EditableGridSelection {
  const ranges = selection.ranges ?? []
  const activeRange = [...ranges].reverse().find((range) =>
    validRange(range, columns, rowCount)
    && !!selection.focus
    && range.focus.rowIndex === selection.focus.rowIndex
    && range.focus.columnId === selection.focus.columnId,
  ) ?? [...ranges].reverse().find((range) => validRange(range, columns, rowCount))
  const candidate = activeRange?.anchor ?? selection.focus
  const anchor = addressIsInGrid(candidate, columns, rowCount) ? candidate : focus
  return { focus, ranges: [{ anchor, focus }] }
}

const addressInRange = (
  address: EditableGridAddress,
  range: EditableGridRange,
  columns: readonly EditableGridColumn[],
): boolean => {
  const addressColumn = columnIndexOf(columns, address.columnId)
  const anchorColumn = columnIndexOf(columns, range.anchor.columnId)
  const focusColumn = columnIndexOf(columns, range.focus.columnId)
  const minRow = Math.min(range.anchor.rowIndex, range.focus.rowIndex)
  const maxRow = Math.max(range.anchor.rowIndex, range.focus.rowIndex)
  const minColumn = Math.min(anchorColumn, focusColumn)
  const maxColumn = Math.max(anchorColumn, focusColumn)
  return address.rowIndex >= minRow
    && address.rowIndex <= maxRow
    && addressColumn >= minColumn
    && addressColumn <= maxColumn
}

export function addressIsSelected(
  selection: EditableGridSelection,
  address: EditableGridAddress,
  columns: readonly EditableGridColumn[],
  rowCount: number,
): boolean {
  if (!addressIsInGrid(address, columns, rowCount)) return false
  const ranges = selection.ranges?.filter((range) => validRange(range, columns, rowCount)) ?? []
  if (ranges.length > 0) return ranges.some((range) => addressInRange(address, range, columns))
  return addressIsInGrid(selection.focus, columns, rowCount)
    && selection.focus.rowIndex === address.rowIndex
    && selection.focus.columnId === address.columnId
}
