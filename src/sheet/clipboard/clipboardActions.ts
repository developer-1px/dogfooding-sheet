import { cellKey, parseCellId, type Cells, type Writes, type WriteCell, type WriteMany, type CellRef } from '../schema'
import { COL_LETTERS, colIndex, offsetFormulaRefs, rectFromIds, rectToTsv, writesFromTsv, writesFromTsvToRect, type Rect } from '@spredsheet/grid'

interface InternalClipboard {
  cut: boolean
  rect: Rect
  text: string
  values: string[][]
}

let internalClipboard: InternalClipboard | null = null

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
  internalClipboard = rect ? {
    cut,
    rect,
    text: tsv,
    values: tsv.split('\n').map((row) => row.split('\t')),
  } : null
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

function writesFromInternalClipboard(
  clip: InternalClipboard,
  anchor: CellRef,
  bounds: { maxRow?: number; maxCol?: number } = {},
): Writes {
  const maxRow = bounds.maxRow ?? Infinity
  const maxCol = bounds.maxCol ?? COL_LETTERS.length
  const c0 = colIndex(anchor.col)
  const writes: Writes = []
  for (let r = 0; r < clip.values.length; r++) {
    const row = clip.values[r]
    for (let c = 0; c < row.length; c++) {
      const tr = anchor.row + r
      const tc = c0 + c
      const col = COL_LETTERS[tc]
      if (tr >= maxRow || tc >= maxCol || !col) continue
      const sourceRow = clip.rect.rMin + r
      const sourceCol = clip.rect.cMin + c
      const value = clip.cut ? row[c] : offsetFormulaRefs(row[c], tr - sourceRow, tc - sourceCol, maxRow)
      writes.push([cellKey(col, tr), value])
    }
  }
  return writes
}

function writesFromInternalClipboardToRect(
  clip: InternalClipboard,
  target: Rect,
  bounds: { maxRow?: number; maxCol?: number } = {},
): Writes {
  const maxRow = bounds.maxRow ?? Infinity
  const maxCol = bounds.maxCol ?? COL_LETTERS.length
  const writes: Writes = []
  for (let r = target.rMin; r <= target.rMax; r++) {
    const sourceRowOffset = (r - target.rMin) % clip.values.length
    const row = clip.values[sourceRowOffset] ?? ['']
    for (let c = target.cMin; c <= target.cMax; c++) {
      const col = COL_LETTERS[c]
      if (r >= maxRow || c >= maxCol || !col) continue
      const sourceColOffset = (c - target.cMin) % row.length
      const sourceRow = clip.rect.rMin + sourceRowOffset
      const sourceCol = clip.rect.cMin + sourceColOffset
      const raw = row[sourceColOffset] ?? ''
      const value = clip.cut ? raw : offsetFormulaRefs(raw, r - sourceRow, c - sourceCol, maxRow)
      writes.push([cellKey(col, r), value])
    }
  }
  return writes
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
