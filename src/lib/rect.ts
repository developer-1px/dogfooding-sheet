import { COL_LETTERS, cellKey, parseCellId, colIndex, type CellRef } from './a1'

export interface Rect { rMin: number; rMax: number; cMin: number; cMax: number }

/** Single-cell rect at the given cell reference. */
export const rectOfCell = (p: CellRef): Rect => {
  const ci = colIndex(p.col)
  return { rMin: p.row, rMax: p.row, cMin: ci, cMax: ci }
}

/** Bounding rect of two cell references (corners in any order). */
export const rectFromRefs = (a: CellRef, b: CellRef): Rect => {
  const c1 = colIndex(a.col), c2 = colIndex(b.col)
  return {
    rMin: Math.min(a.row, b.row),
    rMax: Math.max(a.row, b.row),
    cMin: Math.min(c1, c2),
    cMax: Math.max(c1, c2),
  }
}

export const formatRect = (rect: Rect): string => {
  const a = cellKey(COL_LETTERS[rect.cMin], rect.rMin)
  const b = cellKey(COL_LETTERS[rect.cMax], rect.rMax)
  return a === b ? a : `${a}:${b}`
}

/** Enumerate DOM cell ids `r{row}-{col}` covered by a rect (inclusive bounds). */
export function idsInRect(rect: Rect): string[] {
  const out: string[] = []
  for (let r = rect.rMin; r <= rect.rMax; r++)
    for (let c = rect.cMin; c <= rect.cMax; c++) out.push(`r${r}-${COL_LETTERS[c]}`)
  return out
}

/** Convenience: enumerate as a Set; `null` → empty set. */
export const rectToIdSet = (rect: Rect | null): Set<string> =>
  new Set(rect ? idsInRect(rect) : [])

export function rectFromIds(ids: string[]): Rect | null {
  const cells = ids.map(parseCellId).flatMap((x) => x ? [x] : [])
  if (cells.length === 0) return null
  let rMin = Infinity, rMax = -Infinity, cMin = Infinity, cMax = -Infinity
  for (const { col, row } of cells) {
    const ci = colIndex(col)
    if (row < rMin) rMin = row
    if (row > rMax) rMax = row
    if (ci < cMin) cMin = ci
    if (ci > cMax) cMax = ci
  }
  return { rMin, rMax, cMin, cMax }
}
