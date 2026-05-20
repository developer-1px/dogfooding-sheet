import type { EvalCell } from './args'
import { cellKey, columnLabel, parseA1, type Cells } from '../a1'
import { rectOfCell, rectFromRefs, type Rect } from '../rect'


export const parseRange = (s: string): Rect | null => {
  const trimmed = s.trim()
  const colon = trimmed.indexOf(':')
  if (colon < 0) {
    const p = parseA1(trimmed)
    return p ? rectOfCell(p) : null
  }
  const a = parseA1(trimmed.slice(0, colon))
  const b = parseA1(trimmed.slice(colon + 1))
  return a && b ? rectFromRefs(a, b) : null
}

export const evalCell = (_cells: Cells, c: number, r: number, evalCellRef: EvalCell): string =>
  evalCellRef(cellKey(columnLabel(c), r))
