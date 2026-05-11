import { rectFromIds } from './rect'
import { pad2 } from './numeric'
import { rectToTsv, pasteTsv } from './clipboard'
import { cellKey, parseCellId, type Cells, type Writes, type WriteCell, type WriteMany, type Display, type CellRef } from './a1'


export function freezeFormulas(
  ids: string[], cells: Cells, display: Display,
  writeCell: WriteCell,
  writeCells?: WriteMany,
): void {
  const writes: Writes = []
  for (const id of ids) {
    const p = parseCellId(id); if (!p) continue
    const k = cellKey(p.col, p.row)
    if ((cells[k] ?? '').startsWith('=')) writes.push([k, display(k)])
  }
  if (writes.length === 0) return
  if (writeCells) writeCells(writes); else for (const [k, v] of writes) writeCell(k, v)
}

export function insertNowOrToday(
  focusId: string | null, withTime: boolean,
  writeCell: WriteCell,
): void {
  const p = focusId ? parseCellId(focusId) : null; if (!p) return
  const d = new Date()
  writeCell(cellKey(p.col, p.row), withTime
    ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
    : `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`)
}

export function copyOrCut(
  ids: string[], cut: boolean, cells: Cells,
  writeCell: WriteCell,
  writeCells?: WriteMany,
): void {
  const rect = rectFromIds(ids)
  const tsv = rect ? rectToTsv(rect, (k) => cells[k] ?? '') : ''
  navigator.clipboard?.writeText(tsv).catch(() => {})
  if (!cut) return
  const clears: Writes = []
  for (const id of ids) { const p = parseCellId(id); if (p) clears.push([cellKey(p.col, p.row), '']) }
  if (writeCells) writeCells(clears); else for (const [k, v] of clears) writeCell(k, v)
}

export function pasteAt(
  focusKey: string, p: CellRef, maxRow: number,
  writeCell: WriteCell,
  writeCells?: WriteMany,
): void {
  navigator.clipboard?.readText()
    .then((t) => t.includes('\t') || t.includes('\n') ? pasteTsv(t, p, writeCell, { maxRow, writeMany: writeCells }) : writeCell(focusKey, t))
    .catch(() => {})
}
