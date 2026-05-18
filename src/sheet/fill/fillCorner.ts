import { colIndex, parseCellId } from '../schema'
import { rectFromIds } from '@spredsheet/grid'

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
