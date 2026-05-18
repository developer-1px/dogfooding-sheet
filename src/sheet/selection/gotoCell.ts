import { resolveCellRef, resolveGotoTarget, resolveRange, selectionAddress } from '@spredsheet/grid'

export { resolveCellRef, resolveRange, selectionAddress }

/** Resolve raw input and apply if valid. Accepts "B5" or "A1:B5". */
export function gotoCell(raw: string | null, setFocusId: (id: string) => void, setSelectedIds?: (ids: string[]) => void, bounds?: { rowCount: number; colCount: number }, setSelectAnchor?: (id: string | null) => void): boolean {
  const target = resolveGotoTarget(raw, bounds)
  if (!target) return false
  setFocusId(target.focusId)
  setSelectedIds?.(target.selectedIds)
  setSelectAnchor?.(target.focusId)
  return true
}
