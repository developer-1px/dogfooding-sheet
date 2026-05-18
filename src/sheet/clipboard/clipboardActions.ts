import { cellKey, parseCellId, type Cells, type Writes, type WriteCell, type WriteMany, type CellRef } from '../schema'
import { rectFromIds, rectToTsv, writesFromTsv } from '@spredsheet/grid'

const flush = (writes: Writes, write: WriteCell, writeMany?: WriteMany) => {
  if (writes.length === 0) return
  if (writeMany) writeMany(writes)
  else for (const [k, v] of writes) write(k, v)
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
  flush(clears, writeCell, writeCells)
}

export function pasteTsvAt(
  tsv: string,
  anchor: CellRef,
  writeCell: WriteCell,
  bounds: { maxRow?: number; maxCol?: number; writeMany?: WriteMany } = {},
): void {
  flush(writesFromTsv(tsv, anchor, bounds), writeCell, bounds.writeMany)
}

export function pasteAt(
  focusKey: string, p: CellRef, maxRow: number,
  writeCell: WriteCell,
  writeCells?: WriteMany,
  maxCol?: number,
): void {
  navigator.clipboard?.readText()
    .then((t) => t.includes('\t') || t.includes('\n') ? pasteTsvAt(t, p, writeCell, { maxRow, maxCol, writeMany: writeCells }) : writeCell(focusKey, t))
    .catch(() => {})
}

export function copySingleCell(value: string): void {
  navigator.clipboard?.writeText(value).catch(() => {})
}

export function cutSingleCell(value: string, key: string, writeCell: WriteCell): void {
  copySingleCell(value)
  writeCell(key, '')
}

export function pasteSingleCell(key: string, writeCell: WriteCell): void {
  navigator.clipboard?.readText().then((text) => writeCell(key, text)).catch(() => {})
}
