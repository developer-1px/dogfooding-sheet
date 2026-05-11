import { COL_LETTERS, cellKey, colIndex, parseCellId, type Cells, type Writes, type WriteCell, type WriteMany, type Display, type CellRef } from './a1'
import { rectFromIds, type Rect } from './rect'

export function rectToTsv(rect: Rect, get: Display): string {
  const rows: string[] = []
  for (let r = rect.rMin; r <= rect.rMax; r++) {
    const cols: string[] = []
    for (let c = rect.cMin; c <= rect.cMax; c++) {
      cols.push(get(cellKey(COL_LETTERS[c], r)))
    }
    rows.push(cols.join('\t'))
  }
  return rows.join('\n')
}

export function pasteTsv(
  tsv: string,
  anchor: CellRef,
  write: WriteCell,
  bounds: { maxRow?: number; maxCol?: number; writeMany?: WriteMany } = {},
) {
  const maxRow = bounds.maxRow ?? Infinity
  const maxCol = bounds.maxCol ?? COL_LETTERS.length
  const rows = tsv.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n')
  const c0 = colIndex(anchor.col)
  const writes: Writes = []
  for (let r = 0; r < rows.length; r++) {
    const cols = rows[r].split('\t')
    for (let c = 0; c < cols.length; c++) {
      const tr = anchor.row + r; const tc = c0 + c
      if (tr >= maxRow || tc >= maxCol) continue
      writes.push([cellKey(COL_LETTERS[tc], tr), cols[c]])
    }
  }
  if (writes.length === 0) return
  if (bounds.writeMany) bounds.writeMany(writes); else for (const [k, v] of writes) write(k, v)
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
