import { cellId, colIndex, columnLabels, parseA1, parseCellId } from '../coordinates/a1'
import { formatRect, idsInRect, rectFromIds, rectFromRefs } from '../geometry/rect'
import { idsForCol, idsForRow } from './range'

export interface GridBounds {
  rowCount: number
  colCount: number
}

export function selectionAddress(
  selectedIds: string[],
  focusKey: string | null,
  rowCount: number,
  colLetters: readonly string[],
): string | null {
  const rect = selectedIds.length > 1 ? rectFromIds(selectedIds) : null
  if (!rect) return focusKey
  const fullRows = rect.rMin === 0 && rect.rMax === rowCount - 1
  const fullCols = rect.cMin === 0 && rect.cMax === colLetters.length - 1
  if (fullRows && fullCols) return `${colLetters[rect.cMin]}:${colLetters[rect.cMax]}`
  if (fullRows) return `${colLetters[rect.cMin]}:${colLetters[rect.cMax]}`
  if (fullCols) return `${rect.rMin + 1}:${rect.rMax + 1}`
  return formatRect(rect)
}

export function resolveCellRef(raw: string, bounds?: GridBounds): string | null {
  const p = parseA1(raw.trim().toUpperCase())
  if (!p) return null
  if (p.row < 0) return null
  const c = colIndex(p.col)
  if (bounds && (p.row >= bounds.rowCount || c < 0 || c >= bounds.colCount)) return null
  return cellId(p.col, p.row)
}

export function resolveRange(
  raw: string,
  bounds?: GridBounds,
  colLetters: readonly string[] = defaultColLetters(bounds?.colCount),
): string[] | null {
  const value = raw.trim().toUpperCase()
  const parts = value.split(':')
  if (parts.length !== 2) return null
  const rowCount = bounds?.rowCount
  const colCount = bounds?.colCount
  const colA = /^[A-Z]+$/.test(parts[0]) ? parts[0] : null
  const colB = /^[A-Z]+$/.test(parts[1]) ? parts[1] : null
  if (colA && colB) {
    if (!rowCount) return null
    const a = colIndex(colA)
    const b = colIndex(colB)
    if (a < 0 || b < 0) return null
    if (colCount && (a >= colCount || b >= colCount)) return null
    const ids: string[] = []
    for (let c = Math.min(a, b); c <= Math.max(a, b); c++) ids.push(...idsForCol(colLetters[c], rowCount))
    return ids
  }
  const rowA = /^\d+$/.test(parts[0]) ? Number(parts[0]) - 1 : null
  const rowB = /^\d+$/.test(parts[1]) ? Number(parts[1]) - 1 : null
  if (rowA !== null && rowB !== null) {
    if (!bounds || !colCount || rowA < 0 || rowB < 0 || rowA >= bounds.rowCount || rowB >= bounds.rowCount) return null
    const ids: string[] = []
    for (let r = Math.min(rowA, rowB); r <= Math.max(rowA, rowB); r++) ids.push(...idsForRow(r, colLetters))
    return ids
  }
  const a = resolveCellRef(parts[0], bounds)
  const b = resolveCellRef(parts[1], bounds)
  if (!a || !b) return null
  const refA = parseCellId(a)
  const refB = parseCellId(b)
  return refA && refB ? idsInRect(rectFromRefs(refA, refB)) : null
}

export type GotoGridTarget =
  | { type: 'cell'; focusId: string; selectedIds: [] }
  | { type: 'range'; focusId: string; selectedIds: string[] }

export function resolveGotoTarget(raw: string | null, bounds?: GridBounds, colLetters?: readonly string[]): GotoGridTarget | null {
  if (!raw) return null
  if (raw.includes(':')) {
    const ids = resolveRange(raw, bounds, colLetters ? [...colLetters] : defaultColLetters(bounds?.colCount))
    return ids && ids.length > 0 ? { type: 'range', focusId: ids[0], selectedIds: ids } : null
  }
  const id = resolveCellRef(raw, bounds)
  return id ? { type: 'cell', focusId: id, selectedIds: [] } : null
}

const defaultColLetters = (colCount = 26): string[] =>
  columnLabels(Math.max(1, colCount))
