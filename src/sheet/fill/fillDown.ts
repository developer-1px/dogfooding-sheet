import { idsInRect, rectFromIds, type Rect } from '@spredsheet/grid'
import type { FillCellRange } from '../schema'

const selectedRect = (selectedIds: string[]): Rect | null => {
  if (selectedIds.length < 2) return null
  const rect = rectFromIds(selectedIds)
  if (!rect) return null
  const ids = idsInRect(rect)
  const selected = new Set(selectedIds)
  return ids.length === selected.size && ids.every((id) => selected.has(id)) ? rect : null
}

/** Copy top-most selected cell per column down into rest of selection (Cmd+D). */
export function fillDown(selectedIds: string[], fillCellRange: FillCellRange): boolean {
  const rect = selectedRect(selectedIds)
  if (!rect || rect.rMin === rect.rMax) return false
  return fillCellRange({ ...rect, rMax: rect.rMin }, rect)
}

/** Mirror of fillDown: copy left-most cell per row rightward within selection. */
export function fillRight(selectedIds: string[], fillCellRange: FillCellRange): boolean {
  const rect = selectedRect(selectedIds)
  if (!rect || rect.cMin === rect.cMax) return false
  return fillCellRange({ ...rect, cMax: rect.cMin }, rect)
}
