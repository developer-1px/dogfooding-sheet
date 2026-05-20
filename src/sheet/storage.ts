import { SheetSchema, initialSheet, colLettersFor, ROW_COUNT, cellKey, cellId, moveCellIdByDelta, type Sheet } from './schema'
import { type NormalizedData } from '@interactive-os/aria-kernel'
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

export function buildData(getCell: (k: string, col: string, row: number) => string, rowCount = ROW_COUNT, colLetters = colLettersFor(10)): NormalizedData {
  const entities: NormalizedData['entities'] = {}
  const relationships: NormalizedData['relationships'] = {}
  const root: string[] = []

  for (const col of colLetters) {
    const id = `h-${col}`
    root.push(id)
    entities[id] = { label: col }
  }
  for (let row = 0; row < rowCount; row++) {
    const rowId = `r${row}`
    const children: string[] = []
    root.push(rowId)
    entities[rowId] = { label: String(row + 1) }
    relationships[rowId] = children
    for (const col of colLetters) {
      const id = cellId(col, row)
      children.push(id)
      entities[id] = { label: getCell(cellKey(col, row), col, row) }
    }
  }

  return { entities, relationships, meta: { root } }
}
