import { parseCellId, parseA1, colIndex, cellId } from '../schema'
import { idsInRect, rectFromRefs } from '@spredsheet/grid'

/** Resolve a cell address (e.g. "B5") to a focus id. Returns null on bad input. */
export function resolveCellRef(raw: string, bounds?: { rowCount: number; colCount: number }): string | null {
  const p = parseA1(raw.trim().toUpperCase())
  if (!p) return null
  if (p.row < 0) return null
  if (bounds && (p.row < 0 || p.row >= bounds.rowCount || colIndex(p.col) < 0 || colIndex(p.col) >= bounds.colCount)) return null
  return cellId(p.col, p.row)
}

/** Resolve a range like "A1:B5" to a list of cell ids, or null on bad input. */
export function resolveRange(raw: string, bounds?: { rowCount: number; colCount: number }): string[] | null {
  const parts = raw.trim().split(':')
  if (parts.length !== 2) return null
  const a = resolveCellRef(parts[0], bounds); const b = resolveCellRef(parts[1], bounds)
  if (!a || !b) return null
  return idsInRect(rectFromRefs(parseCellId(a)!, parseCellId(b)!))
}

/** Resolve raw input and apply if valid. Accepts "B5" or "A1:B5". */
export function gotoCell(raw: string | null, setFocusId: (id: string) => void, setSelectedIds?: (ids: string[]) => void, bounds?: { rowCount: number; colCount: number }): boolean {
  if (!raw) return false
  if (raw.includes(':')) {
    const ids = resolveRange(raw, bounds); if (!ids || ids.length === 0) return false
    setFocusId(ids[0]); setSelectedIds?.(ids); return true
  }
  const id = resolveCellRef(raw, bounds)
  if (id) { setFocusId(id); setSelectedIds?.([]); return true }
  return false
}
