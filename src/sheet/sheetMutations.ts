import type { JsonOps } from 'zod-crud'
import { ROW_COUNT, type Sheet } from './schema'
import { insertRow as insertRowOp, deleteRow as deleteRowOp, insertCol as insertColOp, deleteCol as deleteColOp } from '../lib/rowOps'
import { sortByColumn } from '../lib/sortOps'

export function sheetMutations(sheet: Sheet, ops: JsonOps<Sheet>) {
  return {
    insertRow: (atRow: number) => ops.replace('/cells', insertRowOp(sheet.cells, atRow, ROW_COUNT)),
    deleteRow: (atRow: number) => ops.replace('/cells', deleteRowOp(sheet.cells, atRow)),
    insertCol: (col: string) => ops.replace('/cells', insertColOp(sheet.cells, 'ABCDEFGHIJ'.indexOf(col))),
    deleteCol: (col: string) => ops.replace('/cells', deleteColOp(sheet.cells, 'ABCDEFGHIJ'.indexOf(col))),
    sortByCol: (col: string, dir: 'asc' | 'desc') =>
      ops.replace('/cells', sortByColumn(sheet.cells, { col, dir, rowCount: ROW_COUNT })),
  }
}
