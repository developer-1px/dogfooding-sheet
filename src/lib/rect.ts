import { COL_LETTERS, parseCellId, colIndex } from './a1'

export interface Rect { rMin: number; rMax: number; cMin: number; cMax: number }

export const formatRect = (rect: Rect): string => {
  const a = `${COL_LETTERS[rect.cMin]}${rect.rMin + 1}`
  const b = `${COL_LETTERS[rect.cMax]}${rect.rMax + 1}`
  return a === b ? a : `${a}:${b}`
}

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
