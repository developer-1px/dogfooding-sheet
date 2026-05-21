import { COL_LETTERS, cellKey, colIndex, parseA1, type Sheet } from '../schema'

export const rowAfterInsert = (row: number, atRow: number, rowCount: number): number | null =>
  row < atRow ? row : row + 1 < rowCount ? row + 1 : null

export const rowAfterDelete = (row: number, atRow: number): number | null =>
  row === atRow ? null : row < atRow ? row : row - 1

export const colAfterInsert = (col: string, atCol: number, colCount: number): string | null => {
  const index = colIndex(col)
  if (index < 0 || index >= colCount) return null
  const nextIndex = index < atCol ? index : index + 1
  return nextIndex < colCount ? COL_LETTERS[nextIndex] ?? null : null
}

export const colAfterDelete = (col: string, atCol: number, colCount: number): string | null => {
  const index = colIndex(col)
  if (index < 0 || index >= colCount || index === atCol) return null
  return COL_LETTERS[index < atCol ? index : index - 1] ?? null
}

export const shiftCellScopedRecord = <V>(
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

export const shiftRowRecord = <V>(
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

export const shiftColRecord = <V>(
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

export const shiftHiddenRows = (rows: number[], shift: (row: number) => number | null): number[] => {
  const shiftedRows = new Set<number>()
  for (const row of rows) {
    const shifted = shift(row)
    if (shifted !== null) shiftedRows.add(shifted)
  }
  return [...shiftedRows].sort((a, b) => a - b)
}

export const shiftHiddenCols = (cols: string[], shift: (col: string) => string | null): string[] => {
  const shiftedCols = new Set<string>()
  for (const col of cols) {
    const shifted = shift(col)
    if (shifted !== null) shiftedCols.add(shifted)
  }
  return [...shiftedCols]
}

export const shiftCondFormat = (
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

export const cellsInBounds = (cells: Sheet['cells'], sheet: Pick<Sheet, 'rowCount' | 'colCount'>): Sheet['cells'] => {
  const next: Sheet['cells'] = {}
  for (const [key, value] of Object.entries(cells)) {
    const ref = parseA1(key)
    if (!ref) continue
    const col = colIndex(ref.col)
    if (ref.row >= 0 && ref.row < sheet.rowCount && col >= 0 && col < sheet.colCount) next[key] = value
  }
  return next
}

export const validRow = (row: number, rowCount: number): boolean =>
  Number.isInteger(row) && row >= 0 && row < rowCount

export const validCol = (col: string, colCount: number): number | null => {
  const index = colIndex(col)
  return index >= 0 && index < colCount ? index : null
}

export const appendedCount = (current: number, count: number, max: number): number | null => {
  if (!Number.isInteger(count) || count <= 0) return null
  const next = Math.min(max, current + count)
  return next === current ? null : next
}
