import { MAX_COL_COUNT, MAX_ROW_COUNT, type Sheet, type SheetOps } from '../schema'
import {
  appendedCount,
  applyStructuralPatch,
  deleteColPatch,
  deleteRowPatch,
  insertColPatch,
  insertRowPatch,
  sortPatch,
  validCol,
  validRow,
} from './sheetStructuralPatches'

export { sheetPatchValueEqual } from './sheetPatchValueEqual'

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
    insertRow: (atRow) => {
      if (validRow(atRow, sheet.rowCount)) applyStructuralPatch(sheet, ops, insertRowPatch(sheet, atRow))
    },
    deleteRow: (atRow) => {
      if (validRow(atRow, sheet.rowCount)) applyStructuralPatch(sheet, ops, deleteRowPatch(sheet, atRow))
    },
    insertCol: (col) => {
      const atCol = validCol(col, sheet.colCount)
      if (atCol !== null) applyStructuralPatch(sheet, ops, insertColPatch(sheet, atCol))
    },
    deleteCol: (col) => {
      const atCol = validCol(col, sheet.colCount)
      if (atCol !== null) applyStructuralPatch(sheet, ops, deleteColPatch(sheet, atCol))
    },
    appendRows: (count = 20) => {
      const next = appendedCount(sheet.rowCount, count, MAX_ROW_COUNT)
      if (next !== null) ops.replace('/rowCount', next)
    },
    appendCols: (count = 1) => {
      const next = appendedCount(sheet.colCount, count, MAX_COL_COUNT)
      if (next !== null) ops.replace('/colCount', next)
    },
    sortByCol: (col, dir) => {
      if (sheet.rowCount > 1 && validCol(col, sheet.colCount) !== null) applyStructuralPatch(sheet, ops, sortPatch(sheet, col, dir))
    },
  }
}
