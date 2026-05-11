import { COL_LETTERS, ROW_COUNT, colIndex, type Sheet, type SheetOps } from './schema'
import { insertRow as insertRowOp, deleteRow as deleteRowOp, insertCol as insertColOp, deleteCol as deleteColOp } from '../lib/rowOps'
import { sortByColumn } from '../lib/sortOps'
import type { Patch } from '../lib/dictOps'

// Row/col mutations invalidate merge row/col indices. Clear merges defensively
// (preferable to silently mis-aligned merges) and batch with the cells write so undo is atomic.
const apply = (sheet: Sheet, ops: SheetOps, nextCells: Record<string, string>) => {
  const patch: Patch = [{ op: 'replace', path: '/cells', value: nextCells }]
  if (sheet.merges.length > 0) patch.push({ op: 'replace', path: '/merges', value: [] })
  ops.patch(patch as never)
}

export function sheetMutations(sheet: Sheet, ops: SheetOps) {
  return {
    insertRow: (atRow: number) => apply(sheet, ops, insertRowOp(sheet.cells, atRow, ROW_COUNT)),
    deleteRow: (atRow: number) => apply(sheet, ops, deleteRowOp(sheet.cells, atRow)),
    insertCol: (col: string) => apply(sheet, ops, insertColOp(sheet.cells, colIndex(col))),
    deleteCol: (col: string) => apply(sheet, ops, deleteColOp(sheet.cells, colIndex(col))),
    sortByCol: (col: string, dir: 'asc' | 'desc') => apply(sheet, ops, sortByColumn(sheet.cells, { col, dir, rowCount: ROW_COUNT })),
  }
}
