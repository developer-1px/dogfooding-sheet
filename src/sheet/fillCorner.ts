import { COL_LETTERS, colIndex } from './schema'
import { parseCellId } from '../lib/a1'
import { rectFromIds, type Rect } from '../lib/rect'

export function rectToIdSet(rect: Rect | null): Set<string> {
  const out = new Set<string>()
  if (!rect) return out
  for (let r = rect.rMin; r <= rect.rMax; r++) {
    for (let c = rect.cMin; c <= rect.cMax; c++) out.add(`r${r}-${COL_LETTERS[c]}`)
  }
  return out
}

export function isFillCorner(cellId: string, focusId: string | null, selectedIds: string[]): boolean {
  if (selectedIds.length > 1) {
    const rect = rectFromIds(selectedIds)
    if (!rect) return false
    const p = parseCellId(cellId)
    if (!p) return false
    return p.row === rect.rMax && colIndex(p.col) === rect.cMax
  }
  return cellId === focusId
}
