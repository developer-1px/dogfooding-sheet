import { parseCellId, parseA1, colIndex, cellId } from '../schema'
import { idsForCol, idsForRow, idsInRect, rectFromRefs } from '@spredsheet/grid'

const colLettersForCount = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i))

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
  const value = raw.trim().toUpperCase()
  const parts = value.split(':')
  if (parts.length !== 2) return null
  const rowCount = bounds?.rowCount
  const colCount = bounds?.colCount
  const colA = /^[A-Z]$/.test(parts[0]) ? parts[0] : null
  const colB = /^[A-Z]$/.test(parts[1]) ? parts[1] : null
  if (colA && colB) {
    if (!rowCount) return null
    const a = colIndex(colA); const b = colIndex(colB)
    if (a < 0 || b < 0) return null
    if (colCount && (a >= colCount || b >= colCount)) return null
    const ids: string[] = []
    for (let c = Math.min(a, b); c <= Math.max(a, b); c++) ids.push(...idsForCol(String.fromCharCode(65 + c), rowCount))
    return ids
  }
  const rowA = /^\d+$/.test(parts[0]) ? Number(parts[0]) - 1 : null
  const rowB = /^\d+$/.test(parts[1]) ? Number(parts[1]) - 1 : null
  if (rowA !== null && rowB !== null) {
    if (!bounds || !colCount || rowA < 0 || rowB < 0 || rowA >= bounds.rowCount || rowB >= bounds.rowCount) return null
    const ids: string[] = []
    const colLetters = colLettersForCount(colCount)
    for (let r = Math.min(rowA, rowB); r <= Math.max(rowA, rowB); r++) ids.push(...idsForRow(r, colLetters))
    return ids
  }
  const a = resolveCellRef(parts[0], bounds); const b = resolveCellRef(parts[1], bounds)
  if (!a || !b) return null
  return idsInRect(rectFromRefs(parseCellId(a)!, parseCellId(b)!))
}

/** Resolve raw input and apply if valid. Accepts "B5" or "A1:B5". */
export function gotoCell(raw: string | null, setFocusId: (id: string) => void, setSelectedIds?: (ids: string[]) => void, bounds?: { rowCount: number; colCount: number }, setSelectAnchor?: (id: string | null) => void): boolean {
  if (!raw) return false
  if (raw.includes(':')) {
    const ids = resolveRange(raw, bounds); if (!ids || ids.length === 0) return false
    setFocusId(ids[0]); setSelectedIds?.(ids); setSelectAnchor?.(ids[0]); return true
  }
  const id = resolveCellRef(raw, bounds)
  if (id) { setFocusId(id); setSelectedIds?.([]); setSelectAnchor?.(id); return true }
  return false
}
