import { SheetSchema, initialSheet, colLettersFor, ROW_COUNT, cellKey, cellId, moveCellIdByDelta, type Sheet } from './schema'
import { type PatternData } from '@interactive-os/aria'
import { readStoredJson, writeStoredJson, type KeyValueStorage } from '../lib/browserStorage'

export const SHEET_STORAGE_KEY = 'spreadsheet:v1'

export const loadInitial = (storage?: KeyValueStorage | null): Sheet => {
  const raw = readStoredJson(SHEET_STORAGE_KEY, storage)
  if (raw === undefined) return initialSheet
  const parsed = SheetSchema.safeParse(raw)
  return parsed.success ? parsed.data : initialSheet
}

export const saveSheet = (sheet: Sheet, storage?: KeyValueStorage | null): void =>
  writeStoredJson(SHEET_STORAGE_KEY, sheet, storage)

export const moveCellId = (id: string, dRow: number, dCol: number, rowCount = ROW_COUNT, colLetters: readonly string[] = colLettersFor(10)): string | null => {
  return moveCellIdByDelta(id, dRow, dCol, { rowCount, colLetters })
}

export function buildData(getCell: (k: string, col: string, row: number) => string, rowCount = ROW_COUNT, colLetters = colLettersFor(10)): PatternData {
  const items: PatternData['items'] = {}
  const rowKeys: string[] = ['header']
  const columnKeys = colLetters.map((col) => `c-${col}`)
  const cells: NonNullable<NonNullable<PatternData['relations']>['cells']>[number][] = []
  const rowIndexByKey: Record<string, number> = { header: 1 }
  const columnIndexByKey: Record<string, number> = {}
  const valueByKey: Record<string, string> = {}
  const editableKeys: string[] = []

  items.header = { label: 'Columns', kind: 'row' }
  for (const [idx, col] of colLetters.entries()) {
    const columnKey = columnKeys[idx]!
    items[columnKey] = { label: col, kind: 'column' }
    const id = `h-${col}`
    items[id] = { label: col, kind: 'columnheader' }
    cells.push({ rowKey: 'header', columnKey, cellKey: id })
    rowIndexByKey[id] = 1
    columnIndexByKey[id] = idx + 1
  }
  for (let row = 0; row < rowCount; row++) {
    const rowId = `r${row}`
    rowKeys.push(rowId)
    items[rowId] = { label: String(row + 1), kind: 'row' }
    rowIndexByKey[rowId] = row + 2
    for (const [idx, col] of colLetters.entries()) {
      const columnKey = columnKeys[idx]!
      const id = cellId(col, row)
      const value = getCell(cellKey(col, row), col, row)
      items[id] = { label: value, kind: 'gridcell' }
      cells.push({ rowKey: rowId, columnKey, cellKey: id })
      rowIndexByKey[id] = row + 2
      columnIndexByKey[id] = idx + 1
      valueByKey[id] = value
      editableKeys.push(id)
    }
  }

  return {
    items,
    relations: { rowKeys, columnKeys, cells },
    state: {
      rowCount: rowCount + 1,
      colCount: colLetters.length,
      rowIndexByKey,
      columnIndexByKey,
      valueByKey,
      editableKeys,
    },
    refs: { label: 'Spreadsheet' },
  }
}
