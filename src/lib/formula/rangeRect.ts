import type { Eval } from './args'
import { COL_LETTERS, cellKey, parseA1, colIndex, type Cells } from '../a1'
import { rectOfCell, type Rect } from '../rect'


export const parseRange = (s: string): Rect | null => {
  const trimmed = s.trim()
  const colon = trimmed.indexOf(':')
  if (colon < 0) {
    const p = parseA1(trimmed)
    if (!p) return null
    return rectOfCell(p)
  }
  const a = parseA1(trimmed.slice(0, colon))
  const b = parseA1(trimmed.slice(colon + 1))
  if (!a || !b) return null
  const c1 = colIndex(a.col), c2 = colIndex(b.col)
  return {
    rMin: Math.min(a.row, b.row),
    rMax: Math.max(a.row, b.row),
    cMin: Math.min(c1, c2),
    cMax: Math.max(c1, c2),
  }
}

export const evalCell = (cells: Cells, c: number, r: number, evalRaw: Eval): string =>
  evalRaw(cells[cellKey(COL_LETTERS[c], r)] ?? '')
