import { cellKey, parseCellId } from './a1'

type Cells = Record<string, string>

/**
 * Copy each column's top-most selected cell down into the rest of the
 * selection within the same column. Mimics Google Sheets Cmd+D.
 */
export function fillDown(selectedIds: string[], cells: Cells, write: (k: string, v: string) => void): void {
  const ps = selectedIds.map(parseCellId).filter((x): x is { col: string; row: number } => !!x)
  if (ps.length < 2) return
  const minRow = Math.min(...ps.map((p) => p.row))
  const sources: Record<string, string> = {}
  for (const p of ps) if (p.row === minRow) sources[p.col] = cells[cellKey(p.col, p.row)] ?? ''
  for (const p of ps) if (p.row !== minRow && p.col in sources) write(cellKey(p.col, p.row), sources[p.col])
}
