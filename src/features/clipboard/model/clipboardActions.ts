import { type Cells, type Writes, type WriteCell, type WriteCellRange, type WriteMany, type CellRef, type Rect } from '../../../entities/Sheet/schema'
import { clearWritesForIds, colIndex, internalClipboardFromTsv, isSafeTsvText, parseTsvMatrix, rectFromIds, rectToTsvBounded, writesFromInternalClipboard, writesFromInternalClipboardToRect, writesFromTsv, writesFromTsvToRect, type GridInternalClipboard } from '@spredsheet/grid'

let internalClipboard: GridInternalClipboard | null = null

interface PasteWriteBounds {
  maxRow?: number
  maxCol?: number
  writeMany?: WriteMany
  writeRange?: WriteCellRange
}

export interface ClipboardTextBridge {
  readText(): Promise<string | null>
  writeText(text: string): Promise<boolean>
}

const defaultClipboardText: ClipboardTextBridge = {
  async writeText(text) {
    try {
      if (!navigator.clipboard) return false
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  },
  async readText() {
    try {
      if (!navigator.clipboard) return null
      return await navigator.clipboard.readText()
    } catch {
      return null
    }
  },
}

const resolveClipboardText = (clipboard?: ClipboardTextBridge): ClipboardTextBridge =>
  clipboard ?? defaultClipboardText

const writeClipboardText = async (text: string, clipboard?: ClipboardTextBridge): Promise<boolean> => {
  try {
    return await resolveClipboardText(clipboard).writeText(text)
  } catch {
    return false
  }
}

const readClipboardText = async (clipboard?: ClipboardTextBridge): Promise<string | null> => {
  try {
    return await resolveClipboardText(clipboard).readText()
  } catch {
    return null
  }
}

const flush = (writes: Writes, write: WriteCell, writeMany?: WriteMany): boolean => {
  try {
    if (writes.length === 0) return true
    if (writeMany) writeMany(writes)
    else for (const [k, v] of writes) write(k, v)
    return true
  } catch {
    return false
  }
}

const boundedCount = (maxExclusive: number | undefined, start: number): number => {
  if (maxExclusive === undefined) return Infinity
  const count = Math.floor(maxExclusive) - start
  return Number.isFinite(count) ? Math.max(0, count) : Infinity
}

const boundedEnd = (endInclusive: number, maxExclusive: number | undefined): number => {
  if (maxExclusive === undefined) return endInclusive
  const end = Math.floor(maxExclusive) - 1
  return Number.isFinite(end) ? Math.min(endInclusive, end) : endInclusive
}

const isRectangularMatrix = (matrix: readonly (readonly string[])[]): boolean => {
  const width = matrix[0]?.length
  return width !== undefined && width > 0 && matrix.every((row) => row.length === width)
}

const tsvRangeAt = (tsv: string, anchor: CellRef, bounds: Pick<PasteWriteBounds, 'maxRow' | 'maxCol'>): { range: Rect; matrix: string[][] } | null => {
  if (!isSafeTsvText(tsv)) return null
  const c0 = colIndex(anchor.col)
  const matrix = parseTsvMatrix(tsv, boundedCount(bounds.maxRow, anchor.row), boundedCount(bounds.maxCol, c0))
  if (!isRectangularMatrix(matrix)) return null
  return {
    range: {
      rMin: anchor.row,
      rMax: anchor.row + matrix.length - 1,
      cMin: c0,
      cMax: c0 + matrix[0]!.length - 1,
    },
    matrix,
  }
}

const tsvRangeIntoRect = (tsv: string, target: Rect, bounds: Pick<PasteWriteBounds, 'maxRow' | 'maxCol'>): { range: Rect; matrix: string[][] } | null => {
  if (!isSafeTsvText(tsv)) return null
  const rMax = boundedEnd(target.rMax, bounds.maxRow)
  const cMax = boundedEnd(target.cMax, bounds.maxCol)
  if (rMax < target.rMin || cMax < target.cMin) return null
  const rowCount = rMax - target.rMin + 1
  const columnCount = cMax - target.cMin + 1
  const source = parseTsvMatrix(tsv, rowCount, columnCount)
  if (source.length === 0) return null
  const matrix = Array.from({ length: rowCount }, (_rowValue, rowOffset) => {
    const sourceRow = source[rowOffset % source.length] ?? ['']
    return Array.from({ length: columnCount }, (_columnValue, columnOffset) =>
      sourceRow[(columnOffset % sourceRow.length)] ?? '')
  })
  return {
    range: { rMin: target.rMin, rMax, cMin: target.cMin, cMax },
    matrix,
  }
}

const writeRange = (planned: { range: Rect; matrix: string[][] } | null, writer?: WriteCellRange): boolean =>
  planned !== null && writer !== undefined && writer(planned.range, planned.matrix)

export function copyOrCut(
  ids: string[], cut: boolean, cells: Cells,
  writeCell: WriteCell,
  writeCells?: WriteMany,
  clipboard?: ClipboardTextBridge,
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
  return writeClipboardText(tsv, clipboard).then((ok) => {
    if (!ok) {
      if (cut && internalClipboard === nextClipboard) internalClipboard = null
      return false
    }
    if (cut && !flush(clearWritesForIds(ids), writeCell, writeCells)) {
      if (internalClipboard === nextClipboard) internalClipboard = null
      return false
    }
    return true
  })
}

export function pasteTsvAt(
  tsv: string,
  anchor: CellRef,
  writeCell: WriteCell,
  bounds: PasteWriteBounds = {},
): boolean {
  if (writeRange(tsvRangeAt(tsv, anchor, bounds), bounds.writeRange)) return true
  return flush(writesFromTsv(tsv, anchor, bounds), writeCell, bounds.writeMany)
}

export function pasteTsvIntoSelection(
  tsv: string,
  selectedIds: string[],
  anchor: CellRef,
  writeCell: WriteCell,
  bounds: PasteWriteBounds = {},
): boolean {
  const rect = selectedIds.length > 1 ? rectFromIds(selectedIds) : null
  if (!rect) {
    return pasteTsvAt(tsv, anchor, writeCell, bounds)
  }
  if (writeRange(tsvRangeIntoRect(tsv, rect, bounds), bounds.writeRange)) return true
  return flush(writesFromTsvToRect(tsv, rect, bounds), writeCell, bounds.writeMany)
}

export function pasteAt(
  focusKey: string, p: CellRef, maxRow: number,
  writeCell: WriteCell,
  writeCells?: WriteMany,
  maxCol?: number,
  selectedIds: string[] = [],
  clipboard?: ClipboardTextBridge,
  writeCellRange?: WriteCellRange,
): Promise<boolean> {
  const pasteInternal = (): boolean => {
    if (!internalClipboard) return false
    const rect = selectedIds.length > 1 ? rectFromIds(selectedIds) : null
    return flush(rect
      ? writesFromInternalClipboardToRect(internalClipboard, rect, { maxRow, maxCol })
      : writesFromInternalClipboard(internalClipboard, p, { maxRow, maxCol }), writeCell, writeCells)
  }

  return readClipboardText(clipboard).then((t) => {
    if (t === null) return pasteInternal()
    if (internalClipboard && internalClipboard.text === t) return pasteInternal()
    if (selectedIds.length > 1) return pasteTsvIntoSelection(t, selectedIds, p, writeCell, { maxRow, maxCol, writeMany: writeCells, writeRange: writeCellRange })
    if (t.includes('\t') || t.includes('\n')) return pasteTsvAt(t, p, writeCell, { maxRow, maxCol, writeMany: writeCells, writeRange: writeCellRange })
    return flush([[focusKey, t]], writeCell)
  })
}

export function copySingleCell(value: string, clipboard?: ClipboardTextBridge): Promise<boolean> {
  return writeClipboardText(value, clipboard)
}

export function cutSingleCell(value: string, key: string, writeCell: WriteCell, clipboard?: ClipboardTextBridge): Promise<boolean> {
  return copySingleCell(value, clipboard).then((ok) => {
    if (!ok) return false
    return flush([[key, '']], writeCell)
  })
}

export function pasteSingleCell(key: string, writeCell: WriteCell, clipboard?: ClipboardTextBridge): Promise<boolean> {
  return readClipboardText(clipboard).then((text) => {
    if (text === null) return false
    return flush([[key, text]], writeCell)
  })
}
