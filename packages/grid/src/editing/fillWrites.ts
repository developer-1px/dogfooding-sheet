import { cellKey, colIndex, parseCellId, type Cells, type Writes } from '../coordinates/a1'

/** Writes for copying the top-most selected cell in each column downward. */
export function fillDownWrites(selectedIds: string[], cells: Cells): Writes {
  const refs = selectedIds.map(parseCellId).flatMap((x) => x ? [x] : [])
  if (refs.length < 2) return []
  const minRow = Math.min(...refs.map((p) => p.row))
  const sources: Record<string, string> = {}
  for (const p of refs) if (p.row === minRow) sources[p.col] = cells[cellKey(p.col, p.row)] ?? ''
  const writes: Writes = []
  for (const p of refs) {
    if (p.row !== minRow && p.col in sources) writes.push([cellKey(p.col, p.row), sources[p.col]])
  }
  return writes
}

/** Writes for copying the left-most selected cell in each row rightward. */
export function fillRightWrites(selectedIds: string[], cells: Cells): Writes {
  const refs = selectedIds.map(parseCellId).flatMap((x) => x ? [x] : [])
  if (refs.length < 2) return []
  const minColIdx = Math.min(...refs.map((p) => colIndex(p.col)))
  const sources: Record<number, string> = {}
  for (const p of refs) if (colIndex(p.col) === minColIdx) sources[p.row] = cells[cellKey(p.col, p.row)] ?? ''
  const writes: Writes = []
  for (const p of refs) {
    if (colIndex(p.col) !== minColIdx && p.row in sources) writes.push([cellKey(p.col, p.row), sources[p.row]])
  }
  return writes
}
