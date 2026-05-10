import { COL_LETTERS } from './schema'
import { rectFromIds } from './clipboard'

export function isFillCorner(cellId: string, focusId: string | null, selectedIds: string[]): boolean {
  if (selectedIds.length > 1) {
    const rect = rectFromIds(selectedIds)
    if (!rect) return false
    const m = /^r(\d+)-([A-J])$/.exec(cellId)
    if (!m) return false
    return Number(m[1]) === rect.rMax && COL_LETTERS.indexOf(m[2] as (typeof COL_LETTERS)[number]) === rect.cMax
  }
  return cellId === focusId
}
