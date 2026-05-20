import { cellKey, colIndex, columnLabel, parseCellId, type CellRef, type Writes } from '../coordinates/a1'
import type { Rect } from '../geometry/rect'
import { offsetFormulaRefs } from '../structure/formulaRefs'
import { isSafeTsvText, parseTsvMatrix } from './tsv'

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

const rectCount = (min: number, max: number): number => {
  const count = Math.floor(max) - Math.floor(min) + 1
  return Number.isFinite(count) ? Math.max(0, count) : 0
}

export interface GridInternalClipboard {
  cut: boolean
  rect: Rect
  text: string
  values: string[][]
}

export function internalClipboardFromTsv(cut: boolean, rect: Rect, text: string): GridInternalClipboard {
  if (!isSafeTsvText(text)) return { cut, rect, text: '', values: [] }
  const rowLimit = rectCount(rect.rMin, rect.rMax)
  const colLimit = rectCount(rect.cMin, rect.cMax)
  return {
    cut,
    rect,
    text,
    values: parseTsvMatrix(text, rowLimit, colLimit),
  }
}

export function clearWritesForIds(ids: string[]): Writes {
  const writes: Writes = []
  for (const id of ids) {
    const p = parseCellId(id)
    if (p) writes.push([cellKey(p.col, p.row), ''])
  }
  return writes
}

export function writesFromInternalClipboard(
  clip: GridInternalClipboard,
  anchor: CellRef,
  bounds: { maxRow?: number; maxCol?: number } = {},
): Writes {
  const c0 = colIndex(anchor.col)
  const rowLimit = boundedCount(bounds.maxRow, anchor.row)
  const colLimit = boundedCount(bounds.maxCol, c0)
  const maxRow = bounds.maxRow ?? Infinity
  const writes: Writes = []
  if (clip.values.length === 0) return writes
  for (let r = 0; r < Math.min(clip.values.length, rowLimit); r++) {
    const row = clip.values[r]
    for (let c = 0; c < Math.min(row.length, colLimit); c++) {
      const tr = anchor.row + r
      const tc = c0 + c
      const col = columnLabel(tc)
      if (!col) continue
      const sourceRow = clip.rect.rMin + r
      const sourceCol = clip.rect.cMin + c
      const value = clip.cut ? row[c] : offsetFormulaRefs(row[c], tr - sourceRow, tc - sourceCol, maxRow)
      writes.push([cellKey(col, tr), value])
    }
  }
  return writes
}

export function writesFromInternalClipboardToRect(
  clip: GridInternalClipboard,
  target: Rect,
  bounds: { maxRow?: number; maxCol?: number } = {},
): Writes {
  const targetRMax = boundedEnd(target.rMax, bounds.maxRow)
  const targetCMax = boundedEnd(target.cMax, bounds.maxCol)
  if (targetRMax < target.rMin || targetCMax < target.cMin) return []
  const maxRow = bounds.maxRow ?? Infinity
  const writes: Writes = []
  if (clip.values.length === 0) return writes
  for (let r = target.rMin; r <= targetRMax; r++) {
    const sourceRowOffset = (r - target.rMin) % clip.values.length
    const row = clip.values[sourceRowOffset] ?? ['']
    for (let c = target.cMin; c <= targetCMax; c++) {
      const col = columnLabel(c)
      if (!col) continue
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
