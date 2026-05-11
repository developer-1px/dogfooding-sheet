import { colIndex } from './schema'
import { parseCellId } from '../lib/a1'
import { rectFromIds } from '../lib/rect'

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
