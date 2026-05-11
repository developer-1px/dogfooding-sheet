import { colIndex } from './schema'
import { parseCellId } from '../lib/a1'
import { rectFromIds, idsInRect, type Rect } from '../lib/rect'

export function rectToIdSet(rect: Rect | null): Set<string> {
  return new Set(rect ? idsInRect(rect) : [])
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
