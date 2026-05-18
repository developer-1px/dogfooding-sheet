import { cellId, colIndex, parseCellId } from '../coordinates/a1'
import { idsInRect, rectFromIds, rectOfCell, type Rect } from '../geometry/rect'

export function rectEq(a: Rect, b: Rect): boolean {
  return a.rMin === b.rMin && a.rMax === b.rMax && a.cMin === b.cMin && a.cMax === b.cMax
}

export function fillSourceRect(selectedIds: string[], focusId: string | null): Rect | null {
  if (selectedIds.length > 1) return rectFromIds(selectedIds)
  if (!focusId) return null
  const p = parseCellId(focusId)
  return p ? rectOfCell(p) : null
}

export function isFillCorner(cellId: string, focusId: string | null, selectedIds: string[]): boolean {
  const rect = fillSourceRect(selectedIds, focusId)
  if (!rect) return false
  const p = parseCellId(cellId)
  if (!p) return false
  return p.row === rect.rMax && colIndex(p.col) === rect.cMax
}

export function fillTargetForCell(
  source: Rect,
  targetCellId: string,
  bounds: { rowCount: number; colLetters: readonly string[] },
): Rect | null {
  const p = parseCellId(targetCellId)
  if (!p) return null
  const ci = colIndex(p.col)
  const dRow = p.row - source.rMax
  const dCol = ci - source.cMax
  if (dRow <= 0 && dCol <= 0) return source
  if (dRow >= dCol) return { ...source, rMax: Math.min(bounds.rowCount - 1, p.row) }
  return { ...source, cMax: Math.min(bounds.colLetters.length - 1, ci) }
}

export function idsInFillTarget(target: Rect, colLetters: readonly string[]): string[] {
  const ids: string[] = []
  for (let r = target.rMin; r <= target.rMax; r++) {
    for (let c = target.cMin; c <= target.cMax; c++) ids.push(cellId(colLetters[c], r))
  }
  return ids
}

export function fillTargetIdSet(target: Rect | null): Set<string> {
  return new Set(target ? idsInRect(target) : [])
}

