import { rectFromIds } from './rect'
import { rectToTsv, pasteTsv } from './clipboard'
import { cellKey, parseCellId, type Cells } from './a1'


export function freezeFormulas(
  ids: string[], cells: Cells, display: (k: string) => string,
  writeCell: (k: string, v: string) => void,
  writeCells?: (writes: Array<[string, string]>) => void,
): void {
  const writes: Array<[string, string]> = []
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
  writeCell: (k: string, v: string) => void,
): void {
  const p = focusId ? parseCellId(focusId) : null; if (!p) return
  const d = new Date(), pad = (n: number) => String(n).padStart(2, '0')
  writeCell(cellKey(p.col, p.row), withTime
    ? `${pad(d.getHours())}:${pad(d.getMinutes())}`
    : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
}

export function copyOrCut(
  ids: string[], cut: boolean, cells: Cells,
  writeCell: (k: string, v: string) => void,
  writeCells?: (writes: Array<[string, string]>) => void,
): void {
  const rect = rectFromIds(ids)
  const tsv = rect ? rectToTsv(rect, (k) => cells[k] ?? '') : ''
  navigator.clipboard?.writeText(tsv).catch(() => {})
  if (!cut) return
  const clears: Array<[string, string]> = []
  for (const id of ids) { const p = parseCellId(id); if (p) clears.push([cellKey(p.col, p.row), '']) }
  if (writeCells) writeCells(clears); else for (const [k, v] of clears) writeCell(k, v)
}

export function pasteAt(
  focusKey: string, p: { col: string; row: number }, maxRow: number,
  writeCell: (k: string, v: string) => void,
  writeCells?: (writes: Array<[string, string]>) => void,
): void {
  navigator.clipboard?.readText()
    .then((t) => t.includes('\t') || t.includes('\n') ? pasteTsv(t, p, writeCell, { maxRow, writeMany: writeCells }) : writeCell(focusKey, t))
    .catch(() => {})
}
