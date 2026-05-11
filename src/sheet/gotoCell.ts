import { parseCellId, parseA1, colIndex } from '../lib/a1'
import { idsInRect } from '../lib/rect'
import { ROW_COUNT } from './schema'

/** Resolve a cell address (e.g. "B5") to a focus id. Returns null on bad input. */
export function resolveCellRef(raw: string): string | null {
  const p = parseA1(raw.trim().toUpperCase())
  if (!p) return null
  if (p.row < 0 || p.row >= ROW_COUNT) return null
  return `r${p.row}-${p.col}`
}

/** Resolve a range like "A1:B5" to a list of cell ids, or null on bad input. */
export function resolveRange(raw: string): string[] | null {
  const parts = raw.trim().split(':')
  if (parts.length !== 2) return null
  const a = resolveCellRef(parts[0]); const b = resolveCellRef(parts[1])
  if (!a || !b) return null
  const pa = parseCellId(a)!; const pb = parseCellId(b)!
  const c1i = colIndex(pa.col), c2i = colIndex(pb.col)
  return idsInRect({
    rMin: Math.min(pa.row, pb.row),
    rMax: Math.max(pa.row, pb.row),
    cMin: Math.min(c1i, c2i),
    cMax: Math.max(c1i, c2i),
  })
}

/** Resolve raw input and apply if valid. Accepts "B5" or "A1:B5". */
export function gotoCell(raw: string | null, setFocusId: (id: string) => void, setSelectedIds?: (ids: string[]) => void): boolean {
  if (!raw) return false
  if (raw.includes(':')) {
    const ids = resolveRange(raw); if (!ids || ids.length === 0) return false
    setFocusId(ids[0]); setSelectedIds?.(ids); return true
  }
  const id = resolveCellRef(raw)
  if (id) { setFocusId(id); setSelectedIds?.([]); return true }
  return false
}
