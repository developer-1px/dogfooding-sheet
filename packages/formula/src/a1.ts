/**
 * A1 notation utilities.
 *
 * Conventions:
 * - Column letters: 'A'..'J' (10 columns; widen the regex to extend).
 * - Row index: 0-based internally, 1-based in A1 display ("A1" ⇄ row=0,col='A').
 * - Cell DOM ids: `r{row}-{col}` (e.g. "r0-A").
 */

export const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const

export type ColLetter = (typeof COL_LETTERS)[number]

/** Parsed cell reference: column letter + 0-based row. */
export interface CellRef { col: string; row: number }

/** A1 cell key: `${col}${row+1}` — `cellKey('A', 0) === 'A1'`. */
export const cellKey = (col: string, row: number): string => `${col}${row + 1}`

/** Sheet cell map: A1-key → raw value. */
export type Cells = Record<string, string>

/** Batched cell writes: array of `[cellKey, value]` tuples. */
export type Writes = Array<[string, string]>

/** Single-cell write callback: `(cellKey, value) => void`. */
export type WriteCell = (k: string, v: string) => void

/** Batched-cell write callback: `(writes) => void`. */
export type WriteMany = (writes: Writes) => void

/** Read displayed value for an A1 key: `(cellKey) => string`. */
export type Display = (k: string) => string

/** Global A1 reference regex — match all `[Letter][Digits]` occurrences. */
export const A1_RE = /([A-J])(\d+)/g

/** Format a DOM cell id: `cellId('A', 0) === 'r0-A'` (inverse of `parseCellId`). */
export const cellId = (col: string, row: number): string => `r${row}-${col}`

/** Parse a DOM cell id like "r0-A" into `{ row: 0, col: 'A' }`. Returns `null` on mismatch. */
export const parseCellId = (id: string): { col: ColLetter; row: number } | null => {
  const m = /^r(\d+)-([A-J])$/.exec(id)
  return m ? { row: Number(m[1]), col: m[2] as ColLetter } : null
}

/** Convert a DOM cell id "r{row}-{col}" to A1 key like "B3". Falls back to input on mismatch. */
export const cellIdToKey = (id: string): string => {
  const p = parseCellId(id)
  return p ? cellKey(p.col, p.row) : id
}

/** Parse an A1 key like "B3" into `{ col: 'B', row: 2 }`. Returns `null` on mismatch. */
export const parseA1 = (key: string): CellRef | null => {
  const m = /^([A-J])(\d+)$/.exec(key)
  return m ? { col: m[1], row: Number(m[2]) - 1 } : null
}

/** 0-based column index for a letter — `colIndex('C') === 2`. Returns `-1` if unknown. */
export const colIndex = (col: string): number =>
  (COL_LETTERS as readonly string[]).indexOf(col)
