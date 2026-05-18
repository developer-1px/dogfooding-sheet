export const COL_LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

export type ColLetter = string

export interface CellRef { col: string; row: number }

export const cellKey = (col: string, row: number): string => `${col}${row + 1}`

export type Cells = Record<string, string>

export type Writes = Array<[string, string]>

export type WriteCell = (k: string, v: string) => void

export type WriteMany = (writes: Writes) => void

export type Display = (k: string) => string

export const A1_RE = /([A-Z])(\d+)/g
export const ABS_A1_RE = /(\$?)([A-Z])(\$?)(\d+)/g

export const cellId = (col: string, row: number): string => `r${row}-${col}`

export const parseCellId = (id: string): { col: ColLetter; row: number } | null => {
  const m = /^r(\d+)-([A-Z])$/.exec(id)
  return m && COL_LETTERS.includes(m[2]) ? { row: Number(m[1]), col: m[2] } : null
}

export const cellIdToKey = (id: string): string => {
  const p = parseCellId(id)
  return p ? cellKey(p.col, p.row) : id
}

export const parseA1 = (key: string): CellRef | null => {
  const m = /^\$?([A-Z])\$?(\d+)$/.exec(key)
  return m && COL_LETTERS.includes(m[1]) ? { col: m[1], row: Number(m[2]) - 1 } : null
}

export const colIndex = (col: string): number =>
  (COL_LETTERS as readonly string[]).indexOf(col)

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
