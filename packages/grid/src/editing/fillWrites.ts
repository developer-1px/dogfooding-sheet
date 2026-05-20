import { cellKey, colIndex, parseCellId, type Cells, type Writes } from '../coordinates/a1'

/** Writes for copying the top-most selected cell in each column downward. */
export function fillDownWrites(selectedIds: string[], cells: Cells): Writes {
  const refs: Array<{ col: string; row: number }> = []
  let minRow = Infinity
  for (const id of selectedIds) {
    const ref = parseCellId(id)
    if (!ref) continue
    refs.push(ref)
    if (ref.row < minRow) minRow = ref.row
  }
  if (refs.length < 2) return []
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
  const refs: Array<{ col: string; row: number; colIndex: number }> = []
  let minColIdx = Infinity
  for (const id of selectedIds) {
    const ref = parseCellId(id)
    if (!ref) continue
    const index = colIndex(ref.col)
    refs.push({ ...ref, colIndex: index })
    if (index < minColIdx) minColIdx = index
  }
  if (refs.length < 2) return []
  const sources: Record<number, string> = {}
  for (const p of refs) if (p.colIndex === minColIdx) sources[p.row] = cells[cellKey(p.col, p.row)] ?? ''
  const writes: Writes = []
  for (const p of refs) {
    if (p.colIndex !== minColIdx && p.row in sources) writes.push([cellKey(p.col, p.row), sources[p.row]])
  }
  return writes
}
