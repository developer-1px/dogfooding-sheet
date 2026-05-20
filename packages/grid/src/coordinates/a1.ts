export const columnLabel = (index: number): string => {
  if (!Number.isInteger(index) || index < 0) return ''
  let n = index + 1
  let label = ''
  while (n > 0) {
    n -= 1
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26)
  }
  return label
}

export const columnLabels = (count: number): string[] =>
  Array.from({ length: Math.max(0, count) }, (_, i) => columnLabel(i))

export const COL_LETTERS = columnLabels(26)

export type ColLetter = string

export interface CellRef { col: string; row: number }

export const cellKey = (col: string, row: number): string => `${col}${row + 1}`

export type Cells = Record<string, string>

export type Writes = Array<[string, string]>

export type WriteCell = (k: string, v: string) => void

export type WriteMany = (writes: Writes) => void

export type Display = (k: string) => string

export const A1_RE = /(?<![A-Z0-9_])([A-Z]+)(\d+)(?![A-Z0-9_]|\s*\()/g
export const ABS_A1_RE = /(?<![A-Z0-9_])(\$?)([A-Z]+)(\$?)(\d+)(?![A-Z0-9_]|\s*\()/g

export const cellId = (col: string, row: number): string => `r${row}-${col}`

export const parseCellId = (id: string): { col: ColLetter; row: number } | null => {
  const m = /^r(\d+)-([A-Z]+)$/.exec(id)
  return m ? { row: Number(m[1]), col: m[2] } : null
}

export const cellIdToKey = (id: string): string => {
  const p = parseCellId(id)
  return p ? cellKey(p.col, p.row) : id
}

export const colIndex = (col: string): number =>
  /^[A-Z]+$/.test(col)
    ? [...col].reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1
    : -1

const parseA1RowIndex = (raw: string): number | null => {
  const rowNumber = Number(raw)
  return Number.isSafeInteger(rowNumber) && rowNumber >= 1 ? rowNumber - 1 : null
}

export const parseA1 = (key: string): CellRef | null => {
  const m = /^\$?([A-Z]+)\$?(\d+)$/.exec(key)
  if (!m) return null
  const row = parseA1RowIndex(m[2])
  const col = colIndex(m[1])
  return row !== null && Number.isSafeInteger(col) && col >= 0 ? { col: m[1], row } : null
}

export const moveCellIdByDelta = (
  id: string,
  dRow: number,
  dCol: number,
  bounds: { rowCount: number; colLetters: readonly string[] },
): string | null => {
  const p = parseCellId(id)
  if (!p) return null
  const c = bounds.colLetters.indexOf(p.col)
  if (c < 0) return null
  const row = Math.max(0, Math.min(bounds.rowCount - 1, p.row + dRow))
  const col = Math.max(0, Math.min(bounds.colLetters.length - 1, c + dCol))
  return cellId(bounds.colLetters[col], row)
}
