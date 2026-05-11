import { COL_LETTERS, cellKey, parseCellId, type Cells, type Writes } from './a1'

type WriteMany = (w: Writes) => void

const flush = (writes: Writes, write: (k: string, v: string) => void, writeMany?: WriteMany) => {
  if (writes.length === 0) return
  if (writeMany) writeMany(writes); else for (const [k, v] of writes) write(k, v)
}

/** Copy top-most selected cell per column down into rest of selection (Cmd+D). */
export function fillDown(selectedIds: string[], cells: Cells, write: (k: string, v: string) => void, writeMany?: WriteMany): void {
  const ps = selectedIds.map(parseCellId).flatMap((x) => x ? [x] : [])
  if (ps.length < 2) return
  const minRow = Math.min(...ps.map((p) => p.row))
  const sources: Record<string, string> = {}
  for (const p of ps) if (p.row === minRow) sources[p.col] = cells[cellKey(p.col, p.row)] ?? ''
  const writes: Writes = []
  for (const p of ps) if (p.row !== minRow && p.col in sources) writes.push([cellKey(p.col, p.row), sources[p.col]])
  flush(writes, write, writeMany)
}

/** Mirror of fillDown: copy left-most cell per row rightward within selection. */
export function fillRight(selectedIds: string[], cells: Cells, write: (k: string, v: string) => void, writeMany?: WriteMany): void {
  const ps = selectedIds.map(parseCellId).flatMap((x) => x ? [x] : [])
  if (ps.length < 2) return
  const COLS = COL_LETTERS as readonly string[]
  const minColIdx = Math.min(...ps.map((p) => COLS.indexOf(p.col)))
  const sources: Record<number, string> = {}
  for (const p of ps) if (COLS.indexOf(p.col) === minColIdx) sources[p.row] = cells[cellKey(p.col, p.row)] ?? ''
  const writes: Writes = []
  for (const p of ps) if (COLS.indexOf(p.col) !== minColIdx && p.row in sources) writes.push([cellKey(p.col, p.row), sources[p.row]])
  flush(writes, write, writeMany)
}
