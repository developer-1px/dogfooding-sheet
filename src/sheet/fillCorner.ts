import { COL_LETTERS } from './schema'
import { rectFromIds, type Rect } from '../lib/clipboard'

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
    const m = /^r(\d+)-([A-J])$/.exec(cellId)
    if (!m) return false
    return Number(m[1]) === rect.rMax && COL_LETTERS.indexOf(m[2] as (typeof COL_LETTERS)[number]) === rect.cMax
  }
  return cellId === focusId
}
