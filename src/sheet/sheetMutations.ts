import type { JsonOps } from 'zod-crud'
import { ROW_COUNT, type Sheet } from './schema'
import { insertRow as insertRowOp, deleteRow as deleteRowOp, insertCol as insertColOp, deleteCol as deleteColOp } from '../lib/rowOps'
import { sortByColumn } from '../lib/sortOps'

// Row/col mutations invalidate merge row/col indices. Clear merges defensively
// (preferable to silently mis-aligned merges; user can re-merge after the operation).
const clearMergesIfAny = (sheet: Sheet, ops: JsonOps<Sheet>) => { if (sheet.merges.length > 0) ops.replace('/merges', []) }

export function sheetMutations(sheet: Sheet, ops: JsonOps<Sheet>) {
  return {
    insertRow: (atRow: number) => { clearMergesIfAny(sheet, ops); ops.replace('/cells', insertRowOp(sheet.cells, atRow, ROW_COUNT)) },
    deleteRow: (atRow: number) => { clearMergesIfAny(sheet, ops); ops.replace('/cells', deleteRowOp(sheet.cells, atRow)) },
    insertCol: (col: string) => { clearMergesIfAny(sheet, ops); ops.replace('/cells', insertColOp(sheet.cells, 'ABCDEFGHIJ'.indexOf(col))) },
    deleteCol: (col: string) => { clearMergesIfAny(sheet, ops); ops.replace('/cells', deleteColOp(sheet.cells, 'ABCDEFGHIJ'.indexOf(col))) },
    sortByCol: (col: string, dir: 'asc' | 'desc') => { clearMergesIfAny(sheet, ops); ops.replace('/cells', sortByColumn(sheet.cells, { col, dir, rowCount: ROW_COUNT })) },
  }
}
