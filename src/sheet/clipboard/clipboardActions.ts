import { type Cells, type Writes, type WriteCell, type WriteMany, type CellRef } from '../schema'
import { clearWritesForIds, internalClipboardFromTsv, rectFromIds, rectToTsv, writesFromInternalClipboard, writesFromInternalClipboardToRect, writesFromTsv, writesFromTsvToRect, type GridInternalClipboard } from '@spredsheet/grid'

let internalClipboard: GridInternalClipboard | null = null

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
  internalClipboard = rect ? internalClipboardFromTsv(cut, rect, tsv) : null
  navigator.clipboard?.writeText(tsv).catch(() => {})
  if (!cut) return
  flush(clearWritesForIds(ids), writeCell, writeCells)
}

export function pasteTsvAt(
  tsv: string,
  anchor: CellRef,
  writeCell: WriteCell,
  bounds: { maxRow?: number; maxCol?: number; writeMany?: WriteMany } = {},
): void {
  flush(writesFromTsv(tsv, anchor, bounds), writeCell, bounds.writeMany)
}

export function pasteTsvIntoSelection(
  tsv: string,
  selectedIds: string[],
  anchor: CellRef,
  writeCell: WriteCell,
  bounds: { maxRow?: number; maxCol?: number; writeMany?: WriteMany } = {},
): void {
  const rect = selectedIds.length > 1 ? rectFromIds(selectedIds) : null
  if (!rect) {
    pasteTsvAt(tsv, anchor, writeCell, bounds)
    return
  }
  flush(writesFromTsvToRect(tsv, rect, bounds), writeCell, bounds.writeMany)
}

export function pasteAt(
  focusKey: string, p: CellRef, maxRow: number,
  writeCell: WriteCell,
  writeCells?: WriteMany,
  maxCol?: number,
  selectedIds: string[] = [],
): void {
  navigator.clipboard?.readText()
    .then((t) => {
      if (internalClipboard && internalClipboard.text === t) {
        const rect = selectedIds.length > 1 ? rectFromIds(selectedIds) : null
        flush(rect
          ? writesFromInternalClipboardToRect(internalClipboard, rect, { maxRow, maxCol })
          : writesFromInternalClipboard(internalClipboard, p, { maxRow, maxCol }), writeCell, writeCells)
        return
      }
      if (selectedIds.length > 1) pasteTsvIntoSelection(t, selectedIds, p, writeCell, { maxRow, maxCol, writeMany: writeCells })
      else if (t.includes('\t') || t.includes('\n')) pasteTsvAt(t, p, writeCell, { maxRow, maxCol, writeMany: writeCells })
      else writeCell(focusKey, t)
    })
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
