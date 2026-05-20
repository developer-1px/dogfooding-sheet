import { type Cells, type Writes, type WriteCell, type WriteMany, type CellRef } from '../schema'
import { clearWritesForIds, internalClipboardFromTsv, rectFromIds, rectToTsvBounded, writesFromInternalClipboard, writesFromInternalClipboardToRect, writesFromTsv, writesFromTsvToRect, type GridInternalClipboard } from '@spredsheet/grid'

let internalClipboard: GridInternalClipboard | null = null

const writeClipboardText = async (text: string): Promise<boolean> => {
  try {
    if (!navigator.clipboard) return false
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

const readClipboardText = async (): Promise<string | null> => {
  try {
    if (!navigator.clipboard) return null
    return await navigator.clipboard.readText()
  } catch {
    return null
  }
}

const flush = (writes: Writes, write: WriteCell, writeMany?: WriteMany) => {
  if (writes.length === 0) return
  if (writeMany) writeMany(writes)
  else for (const [k, v] of writes) write(k, v)
}

export function copyOrCut(
  ids: string[], cut: boolean, cells: Cells,
  writeCell: WriteCell,
  writeCells?: WriteMany,
): Promise<boolean> {
  const rect = rectFromIds(ids)
  if (!rect) {
    internalClipboard = null
    return Promise.resolve(false)
  }
  const tsv = rectToTsvBounded(rect, (k) => cells[k] ?? '')
  if (tsv === null) {
    internalClipboard = null
    return Promise.resolve(false)
  }
  const nextClipboard = internalClipboardFromTsv(cut, rect, tsv)
  internalClipboard = nextClipboard
  return writeClipboardText(tsv).then((ok) => {
    if (!ok) {
      if (cut && internalClipboard === nextClipboard) internalClipboard = null
      return false
    }
    if (cut) flush(clearWritesForIds(ids), writeCell, writeCells)
    return true
  })
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
): Promise<boolean> {
  const pasteInternal = (): boolean => {
    if (!internalClipboard) return false
    const rect = selectedIds.length > 1 ? rectFromIds(selectedIds) : null
    flush(rect
      ? writesFromInternalClipboardToRect(internalClipboard, rect, { maxRow, maxCol })
      : writesFromInternalClipboard(internalClipboard, p, { maxRow, maxCol }), writeCell, writeCells)
    return true
  }

  return readClipboardText().then((t) => {
    if (t === null) return pasteInternal()
    if (internalClipboard && internalClipboard.text === t) return pasteInternal()
    if (selectedIds.length > 1) pasteTsvIntoSelection(t, selectedIds, p, writeCell, { maxRow, maxCol, writeMany: writeCells })
    else if (t.includes('\t') || t.includes('\n')) pasteTsvAt(t, p, writeCell, { maxRow, maxCol, writeMany: writeCells })
    else writeCell(focusKey, t)
    return true
  })
}

export function copySingleCell(value: string): Promise<boolean> {
  return writeClipboardText(value)
}

export function cutSingleCell(value: string, key: string, writeCell: WriteCell): Promise<boolean> {
  return copySingleCell(value).then((ok) => {
    if (ok) writeCell(key, '')
    return ok
  })
}

export function pasteSingleCell(key: string, writeCell: WriteCell): Promise<boolean> {
  return readClipboardText().then((text) => {
    if (text === null) return false
    writeCell(key, text)
    return true
  })
}
