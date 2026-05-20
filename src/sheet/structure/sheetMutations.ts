import { MAX_COL_COUNT, MAX_ROW_COUNT, colIndex, type Sheet, type SheetOps } from '../schema'
import { insertRow as insertRowOp, deleteRow as deleteRowOp, insertCol as insertColOp, deleteCol as deleteColOp, sortByColumn } from '@spredsheet/grid'
import { applyPatch, type Patch } from '../../lib/dictOps'

// Row/col mutations invalidate merge row/col indices. Clear merges defensively
// (preferable to silently mis-aligned merges) and batch with the cells write so undo is atomic.
const apply = (sheet: Sheet, ops: SheetOps, nextCells: Record<string, string>) => {
  const patch: Patch = [{ op: 'replace', path: '/cells', value: nextCells }]
  if (sheet.merges.length > 0) patch.push({ op: 'replace', path: '/merges', value: [] })
  applyPatch(ops, patch)
}

export interface SheetMutations {
  insertRow: (atRow: number) => void
  deleteRow: (atRow: number) => void
  insertCol: (col: string) => void
  deleteCol: (col: string) => void
  appendRows: (count?: number) => void
  appendCols: (count?: number) => void
  sortByCol: (col: string, dir: 'asc' | 'desc') => void
}

export function sheetMutations(sheet: Sheet, ops: SheetOps): SheetMutations {
  return {
    insertRow: (atRow) => apply(sheet, ops, insertRowOp(sheet.cells, atRow, sheet.rowCount)),
    deleteRow: (atRow) => apply(sheet, ops, deleteRowOp(sheet.cells, atRow)),
    insertCol: (col) => apply(sheet, ops, insertColOp(sheet.cells, colIndex(col))),
    deleteCol: (col) => apply(sheet, ops, deleteColOp(sheet.cells, colIndex(col))),
    appendRows: (count = 20) => ops.replace('/rowCount', Math.min(MAX_ROW_COUNT, sheet.rowCount + count)),
    appendCols: (count = 1) => ops.replace('/colCount', Math.min(MAX_COL_COUNT, sheet.colCount + count)),
    sortByCol: (col, dir) => apply(sheet, ops, sortByColumn(sheet.cells, { col, dir, rowCount: sheet.rowCount })),
  }
}
