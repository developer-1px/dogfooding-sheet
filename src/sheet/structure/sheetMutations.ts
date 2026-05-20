import { COL_LETTERS, MAX_COL_COUNT, MAX_ROW_COUNT, cellKey, colIndex, parseA1, type Sheet, type SheetOps } from '../schema'
import { insertRow as insertRowOp, deleteRow as deleteRowOp, insertCol as insertColOp, deleteCol as deleteColOp, sortByColumn, sortRowOrder } from '@spredsheet/grid'
import { applyPatch, type Patch } from '../../lib/dictOps'

const isEqual = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b)

const replaceIfChanged = (patch: Patch, path: string, current: unknown, next: unknown) => {
  if (!isEqual(current, next)) patch.push({ op: 'replace', path, value: next })
}

const rowAfterInsert = (row: number, atRow: number, rowCount: number): number | null =>
  row < atRow ? row : row + 1 < rowCount ? row + 1 : null

const rowAfterDelete = (row: number, atRow: number): number | null =>
  row === atRow ? null : row < atRow ? row : row - 1

const colAfterInsert = (col: string, atCol: number, colCount: number): string | null => {
  const index = colIndex(col)
  if (index < 0 || index >= colCount) return null
  const nextIndex = index < atCol ? index : index + 1
  return nextIndex < colCount ? COL_LETTERS[nextIndex] ?? null : null
}

const colAfterDelete = (col: string, atCol: number, colCount: number): string | null => {
  const index = colIndex(col)
  if (index < 0 || index >= colCount || index === atCol) return null
  return COL_LETTERS[index < atCol ? index : index - 1] ?? null
}

const shiftCellScopedRecord = <V>(
  record: Record<string, V>,
  shift: (col: string, row: number) => { col: string; row: number } | null,
): Record<string, V> => {
  const next: Record<string, V> = {}
  for (const [key, value] of Object.entries(record)) {
    const ref = parseA1(key)
    if (!ref) continue
    const shifted = shift(ref.col, ref.row)
    if (shifted) next[cellKey(shifted.col, shifted.row)] = value
  }
  return next
}

const shiftRowRecord = <V>(
  record: Record<string, V>,
  shift: (row: number) => number | null,
): Record<string, V> => {
  const next: Record<string, V> = {}
  for (const [rowKey, value] of Object.entries(record)) {
    if (!/^\d+$/.test(rowKey)) continue
    const row = shift(Number(rowKey))
    if (row !== null) next[String(row)] = value
  }
  return next
}

const shiftColRecord = <V>(
  record: Record<string, V>,
  shift: (col: string) => string | null,
): Record<string, V> => {
  const next: Record<string, V> = {}
  for (const [col, value] of Object.entries(record)) {
    const shifted = shift(col)
    if (shifted) next[shifted] = value
  }
  return next
}

const shiftHiddenRows = (rows: number[], shift: (row: number) => number | null): number[] => {
  const shiftedRows = new Set<number>()
  for (const row of rows) {
    const shifted = shift(row)
    if (shifted !== null) shiftedRows.add(shifted)
  }
  return [...shiftedRows].sort((a, b) => a - b)
}

const shiftHiddenCols = (cols: string[], shift: (col: string) => string | null): string[] => {
  const shiftedCols = new Set<string>()
  for (const col of cols) {
    const shifted = shift(col)
    if (shifted !== null) shiftedCols.add(shifted)
  }
  return [...shiftedCols]
}

const shiftCondFormat = (
  rules: Sheet['condFormat'],
  shift: (col: string) => string | null,
): Sheet['condFormat'] => {
  const byCol = new Map<string, Sheet['condFormat'][number]>()
  for (const rule of rules) {
    const col = shift(rule.col)
    if (col) byCol.set(col, { ...rule, col })
  }
  return [...byCol.values()]
}

const cellsInBounds = (cells: Sheet['cells'], sheet: Pick<Sheet, 'rowCount' | 'colCount'>): Sheet['cells'] => {
  const next: Sheet['cells'] = {}
  for (const [key, value] of Object.entries(cells)) {
    const ref = parseA1(key)
    if (!ref) continue
    const col = colIndex(ref.col)
    if (ref.row >= 0 && ref.row < sheet.rowCount && col >= 0 && col < sheet.colCount) next[key] = value
  }
  return next
}

// Row/col mutations invalidate merge row/col indices. Clear merges defensively
// and batch every moved sheet slice with the cells write so undo is atomic.
const apply = (sheet: Sheet, ops: SheetOps, next: Partial<Sheet> & Pick<Sheet, 'cells'>) => {
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
  if (sheet.merges.length > 0) patch.push({ op: 'replace', path: '/merges', value: [] })
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

const insertRowPatch = (sheet: Sheet, atRow: number) => {
  const shiftRow = (row: number) => rowAfterInsert(row, atRow, sheet.rowCount)
  return {
    cells: cellsInBounds(insertRowOp(sheet.cells, atRow, sheet.rowCount), sheet),
    ...shiftedCellMetadataByRow(sheet, shiftRow),
    rowHeights: shiftRowRecord(sheet.rowHeights, shiftRow),
    hidden: { ...sheet.hidden, rows: shiftHiddenRows(sheet.hidden.rows, shiftRow) },
  }
}

const deleteRowPatch = (sheet: Sheet, atRow: number) => {
  const shiftRow = (row: number) => rowAfterDelete(row, atRow)
  return {
    cells: cellsInBounds(deleteRowOp(sheet.cells, atRow), sheet),
    ...shiftedCellMetadataByRow(sheet, shiftRow),
    rowHeights: shiftRowRecord(sheet.rowHeights, shiftRow),
    hidden: { ...sheet.hidden, rows: shiftHiddenRows(sheet.hidden.rows, shiftRow) },
  }
}

const insertColPatch = (sheet: Sheet, atCol: number) => {
  const shiftCol = (col: string) => colAfterInsert(col, atCol, sheet.colCount)
  return {
    cells: cellsInBounds(insertColOp(sheet.cells, atCol), sheet),
    ...shiftedCellMetadataByCol(sheet, shiftCol),
    condFormat: shiftCondFormat(sheet.condFormat, shiftCol),
    colWidths: shiftColRecord(sheet.colWidths, shiftCol),
    hidden: { ...sheet.hidden, cols: shiftHiddenCols(sheet.hidden.cols, shiftCol) },
  }
}

const deleteColPatch = (sheet: Sheet, atCol: number) => {
  const shiftCol = (col: string) => colAfterDelete(col, atCol, sheet.colCount)
  return {
    cells: cellsInBounds(deleteColOp(sheet.cells, atCol), sheet),
    ...shiftedCellMetadataByCol(sheet, shiftCol),
    condFormat: shiftCondFormat(sheet.condFormat, shiftCol),
    colWidths: shiftColRecord(sheet.colWidths, shiftCol),
    hidden: { ...sheet.hidden, cols: shiftHiddenCols(sheet.hidden.cols, shiftCol) },
  }
}

const sortPatch = (sheet: Sheet, col: string, dir: 'asc' | 'desc') => {
  const opts = { col, dir, rowCount: sheet.rowCount, colCount: sheet.colCount }
  const fromRow = 1
  const rowMap = new Map<number, number>()
  sortRowOrder(sheet.cells, opts).forEach((sourceRow, index) => {
    rowMap.set(sourceRow, fromRow + index)
  })
  const shiftRow = (row: number) => rowMap.get(row) ?? row
  return {
    cells: cellsInBounds(sortByColumn(sheet.cells, opts), sheet),
    ...shiftedCellMetadataByRow(sheet, shiftRow),
    rowHeights: shiftRowRecord(sheet.rowHeights, shiftRow),
    hidden: { ...sheet.hidden, rows: shiftHiddenRows(sheet.hidden.rows, shiftRow) },
  }
}

const validRow = (row: number, rowCount: number): boolean =>
  Number.isInteger(row) && row >= 0 && row < rowCount

const validCol = (col: string, colCount: number): number | null => {
  const index = colIndex(col)
  return index >= 0 && index < colCount ? index : null
}

const appendedCount = (current: number, count: number, max: number): number | null => {
  if (!Number.isInteger(count) || count <= 0) return null
  const next = Math.min(max, current + count)
  return next === current ? null : next
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
    insertRow: (atRow) => { if (validRow(atRow, sheet.rowCount)) apply(sheet, ops, insertRowPatch(sheet, atRow)) },
    deleteRow: (atRow) => { if (validRow(atRow, sheet.rowCount)) apply(sheet, ops, deleteRowPatch(sheet, atRow)) },
    insertCol: (col) => {
      const atCol = validCol(col, sheet.colCount)
      if (atCol !== null) apply(sheet, ops, insertColPatch(sheet, atCol))
    },
    deleteCol: (col) => {
      const atCol = validCol(col, sheet.colCount)
      if (atCol !== null) apply(sheet, ops, deleteColPatch(sheet, atCol))
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
      if (sheet.rowCount > 1 && validCol(col, sheet.colCount) !== null) apply(sheet, ops, sortPatch(sheet, col, dir))
    },
  }
}
