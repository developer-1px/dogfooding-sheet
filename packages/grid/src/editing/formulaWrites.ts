import { cellKey, parseCellId, type Cells, type Display, type Writes } from '../coordinates/a1'

export function freezeFormulaWrites(ids: string[], cells: Cells, display: Display): Writes {
  const writes: Writes = []
  for (const id of ids) {
    const p = parseCellId(id)
    if (!p) continue
    const key = cellKey(p.col, p.row)
    if ((cells[key] ?? '').startsWith('=')) writes.push([key, display(key)])
  }
  return writes
}

