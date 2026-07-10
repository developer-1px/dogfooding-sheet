import { insertRow as insertRowOp, deleteRow as deleteRowOp, insertCol as insertColOp, deleteCol as deleteColOp, sortByColumn, sortRowOrder } from '@spredsheet/grid'
import { applyPatch, type Patch } from '../../../shared/lib/dictOps'
import type { Sheet, SheetOps } from '../../../entities/Sheet/schema'
import { sheetPatchValueEqual } from './sheetPatchValueEqual'
import {
  cellsInBounds,
  colAfterDelete,
  colAfterInsert,
  rowAfterDelete,
  rowAfterInsert,
  shiftCellScopedRecord,
  shiftColRecord,
  shiftCondFormat,
  shiftHiddenCols,
  shiftHiddenRows,
  shiftRowRecord,
} from './sheetStructuralShift'

export { appendedCount, validCol, validRow } from './sheetStructuralShift'

interface StructuralPatch extends Partial<Sheet> {
  cells: Sheet['cells']
  clearMerges?: boolean
}

const replaceIfChanged = (patch: Patch, path: string, current: unknown, next: unknown) => {
  if (!sheetPatchValueEqual(current, next)) patch.push({ op: 'replace', path, value: next })
}

export const structuralPatchSheet = (sheet: Sheet, next: StructuralPatch): Sheet => ({
  ...sheet,
  cells: next.cells,
  notes: next.notes ?? sheet.notes,
  styles: next.styles ?? sheet.styles,
  formats: next.formats ?? sheet.formats,
  validation: next.validation ?? sheet.validation,
  condFormat: next.condFormat ?? sheet.condFormat,
  hidden: next.hidden ?? sheet.hidden,
  colWidths: next.colWidths ?? sheet.colWidths,
  rowHeights: next.rowHeights ?? sheet.rowHeights,
  merges: next.clearMerges ? [] : (next.merges ?? sheet.merges),
})

export const applyStructuralPatch = (
  sheet: Sheet,
  ops: SheetOps,
  next: StructuralPatch,
  applySheetDiff?: (nextSheet: Sheet) => boolean,
) => {
  const patch: Patch = []
  replaceIfChanged(patch, '/cells', sheet.cells, next.cells)
  replaceIfChanged(patch, '/notes', sheet.notes, next.notes ?? sheet.notes)
  replaceIfChanged(patch, '/styles', sheet.styles, next.styles ?? sheet.styles)
  replaceIfChanged(patch, '/formats', sheet.formats, next.formats ?? sheet.formats)
  replaceIfChanged(patch, '/validation', sheet.validation, next.validation ?? sheet.validation)
  replaceIfChanged(patch, '/condFormat', sheet.condFormat, next.condFormat ?? sheet.condFormat)
  replaceIfChanged(patch, '/hidden', sheet.hidden, next.hidden ?? sheet.hidden)
  replaceIfChanged(patch, '/colWidths', sheet.colWidths, next.colWidths ?? sheet.colWidths)
  replaceIfChanged(patch, '/rowHeights', sheet.rowHeights, next.rowHeights ?? sheet.rowHeights)
  if (next.clearMerges && sheet.merges.length > 0) patch.push({ op: 'replace', path: '/merges', value: [] })
  if (patch.length === 0) return
  if (applySheetDiff?.(structuralPatchSheet(sheet, next))) return
  applyPatch(ops, patch)
}

const shiftedCellMetadataByRow = (sheet: Sheet, shiftRow: (row: number) => number | null) => ({
  notes: shiftCellScopedRecord(sheet.notes, (col, row) => {
    const shifted = shiftRow(row)
    return shifted === null ? null : { col, row: shifted }
  }),
  styles: shiftCellScopedRecord(sheet.styles, (col, row) => {
    const shifted = shiftRow(row)
    return shifted === null ? null : { col, row: shifted }
  }),
  formats: shiftCellScopedRecord(sheet.formats, (col, row) => {
    const shifted = shiftRow(row)
    return shifted === null ? null : { col, row: shifted }
  }),
  validation: shiftCellScopedRecord(sheet.validation, (col, row) => {
    const shifted = shiftRow(row)
    return shifted === null ? null : { col, row: shifted }
  }),
})

const shiftedCellMetadataByCol = (sheet: Sheet, shiftCol: (col: string) => string | null) => ({
  notes: shiftCellScopedRecord(sheet.notes, (col, row) => {
    const shifted = shiftCol(col)
    return shifted === null ? null : { col: shifted, row }
  }),
  styles: shiftCellScopedRecord(sheet.styles, (col, row) => {
    const shifted = shiftCol(col)
    return shifted === null ? null : { col: shifted, row }
  }),
  formats: shiftCellScopedRecord(sheet.formats, (col, row) => {
    const shifted = shiftCol(col)
    return shifted === null ? null : { col: shifted, row }
  }),
  validation: shiftCellScopedRecord(sheet.validation, (col, row) => {
    const shifted = shiftCol(col)
    return shifted === null ? null : { col: shifted, row }
  }),
})

export const insertRowPatch = (sheet: Sheet, atRow: number) => {
  const shiftRow = (row: number) => rowAfterInsert(row, atRow, sheet.rowCount)
  return {
    clearMerges: true,
    cells: cellsInBounds(insertRowOp(sheet.cells, atRow, sheet.rowCount), sheet),
    ...shiftedCellMetadataByRow(sheet, shiftRow),
    rowHeights: shiftRowRecord(sheet.rowHeights, shiftRow),
    hidden: { ...sheet.hidden, rows: shiftHiddenRows(sheet.hidden.rows, shiftRow) },
  }
}

export const deleteRowPatch = (sheet: Sheet, atRow: number) => {
  const shiftRow = (row: number) => rowAfterDelete(row, atRow)
  return {
    clearMerges: true,
    cells: cellsInBounds(deleteRowOp(sheet.cells, atRow), sheet),
    ...shiftedCellMetadataByRow(sheet, shiftRow),
    rowHeights: shiftRowRecord(sheet.rowHeights, shiftRow),
    hidden: { ...sheet.hidden, rows: shiftHiddenRows(sheet.hidden.rows, shiftRow) },
  }
}

export const insertColPatch = (sheet: Sheet, atCol: number) => {
  const shiftCol = (col: string) => colAfterInsert(col, atCol, sheet.colCount)
  return {
    clearMerges: true,
    cells: cellsInBounds(insertColOp(sheet.cells, atCol), sheet),
    ...shiftedCellMetadataByCol(sheet, shiftCol),
    condFormat: shiftCondFormat(sheet.condFormat, shiftCol),
    colWidths: shiftColRecord(sheet.colWidths, shiftCol),
    hidden: { ...sheet.hidden, cols: shiftHiddenCols(sheet.hidden.cols, shiftCol) },
  }
}

export const deleteColPatch = (sheet: Sheet, atCol: number) => {
  const shiftCol = (col: string) => colAfterDelete(col, atCol, sheet.colCount)
  return {
    clearMerges: true,
    cells: cellsInBounds(deleteColOp(sheet.cells, atCol), sheet),
    ...shiftedCellMetadataByCol(sheet, shiftCol),
    condFormat: shiftCondFormat(sheet.condFormat, shiftCol),
    colWidths: shiftColRecord(sheet.colWidths, shiftCol),
    hidden: { ...sheet.hidden, cols: shiftHiddenCols(sheet.hidden.cols, shiftCol) },
  }
}

export const sortPatch = (sheet: Sheet, col: string, dir: 'asc' | 'desc') => {
  const opts = { col, dir, rowCount: sheet.rowCount, colCount: sheet.colCount }
  const fromRow = 1
  const rowMap = new Map<number, number>()
  const rowOrder = sortRowOrder(sheet.cells, opts)
  rowOrder.forEach((sourceRow, index) => {
    rowMap.set(sourceRow, fromRow + index)
  })
  const shiftRow = (row: number) => rowMap.get(row) ?? row
  return {
    clearMerges: rowOrder.some((sourceRow, index) => sourceRow !== fromRow + index),
    cells: cellsInBounds(sortByColumn(sheet.cells, opts), sheet),
    ...shiftedCellMetadataByRow(sheet, shiftRow),
    rowHeights: shiftRowRecord(sheet.rowHeights, shiftRow),
    hidden: { ...sheet.hidden, rows: shiftHiddenRows(sheet.hidden.rows, shiftRow) },
  }
}
