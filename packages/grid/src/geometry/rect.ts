import { cellId, cellKey, colIndex, columnLabel, parseCellId, type CellRef } from '../coordinates/a1'

export interface Rect { rMin: number; rMax: number; cMin: number; cMax: number }

export const rectOfCell = (p: CellRef): Rect => {
  const ci = colIndex(p.col)
  return { rMin: p.row, rMax: p.row, cMin: ci, cMax: ci }
}

export const rectFromRefs = (a: CellRef, b: CellRef): Rect => {
  const c1 = colIndex(a.col)
  const c2 = colIndex(b.col)
  return {
    rMin: Math.min(a.row, b.row),
    rMax: Math.max(a.row, b.row),
    cMin: Math.min(c1, c2),
    cMax: Math.max(c1, c2),
  }
}

export const formatRect = (rect: Rect): string => {
  const a = cellKey(columnLabel(rect.cMin), rect.rMin)
  const b = cellKey(columnLabel(rect.cMax), rect.rMax)
  return a === b ? a : `${a}:${b}`
}

export function idsInRect(rect: Rect): string[] {
  const out: string[] = []
  for (let r = rect.rMin; r <= rect.rMax; r++) {
    for (let c = rect.cMin; c <= rect.cMax; c++) out.push(cellId(columnLabel(c), r))
  }
  return out
}

export const rectToIdSet = (rect: Rect | null): Set<string> =>
  new Set(rect ? idsInRect(rect) : [])

export function rectFromIds(ids: string[]): Rect | null {
  let rMin = Infinity, rMax = -Infinity, cMin = Infinity, cMax = -Infinity
  for (const id of ids) {
    const ref = parseCellId(id)
    if (!ref) continue
    const ci = colIndex(ref.col)
    const row = ref.row
    if (row < rMin) rMin = row
    if (row > rMax) rMax = row
    if (ci < cMin) cMin = ci
    if (ci > cMax) cMax = ci
  }
  if (rMin === Infinity) return null
  return { rMin, rMax, cMin, cMax }
}
