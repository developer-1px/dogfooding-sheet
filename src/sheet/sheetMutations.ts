import type { JsonOps } from 'zod-crud'
import { ROW_COUNT, type Sheet } from './schema'
import { insertRow as insertRowOp, deleteRow as deleteRowOp, insertCol as insertColOp, deleteCol as deleteColOp } from '../lib/rowOps'
import { sortByColumn } from '../lib/sortOps'

// Row/col mutations invalidate merge row/col indices. Clear merges defensively
// (preferable to silently mis-aligned merges) and batch with the cells write so undo is atomic.
const apply = (sheet: Sheet, ops: JsonOps<Sheet>, nextCells: Record<string, string>) => {
  const patch: Array<{ op: 'replace'; path: string; value: unknown }> = [{ op: 'replace', path: '/cells', value: nextCells }]
  if (sheet.merges.length > 0) patch.push({ op: 'replace', path: '/merges', value: [] })
  ops.patch(patch as never)
}

export function sheetMutations(sheet: Sheet, ops: JsonOps<Sheet>) {
  return {
    insertRow: (atRow: number) => apply(sheet, ops, insertRowOp(sheet.cells, atRow, ROW_COUNT)),
    deleteRow: (atRow: number) => apply(sheet, ops, deleteRowOp(sheet.cells, atRow)),
    insertCol: (col: string) => apply(sheet, ops, insertColOp(sheet.cells, 'ABCDEFGHIJ'.indexOf(col))),
    deleteCol: (col: string) => apply(sheet, ops, deleteColOp(sheet.cells, 'ABCDEFGHIJ'.indexOf(col))),
    sortByCol: (col: string, dir: 'asc' | 'desc') => apply(sheet, ops, sortByColumn(sheet.cells, { col, dir, rowCount: ROW_COUNT })),
  }
}
