import { COL_LETTERS, cellKey, parseCellId, colIndex } from './a1'

export interface Rect { rMin: number; rMax: number; cMin: number; cMax: number }

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
