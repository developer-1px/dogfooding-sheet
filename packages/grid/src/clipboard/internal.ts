import { cellKey, colIndex, columnLabel, parseCellId, type CellRef, type Writes } from '../coordinates/a1'
import type { Rect } from '../geometry/rect'
import { offsetFormulaRefs } from '../structure/formulaRefs'

export interface GridInternalClipboard {
  cut: boolean
  rect: Rect
  text: string
  values: string[][]
}

export function internalClipboardFromTsv(cut: boolean, rect: Rect, text: string): GridInternalClipboard {
  return {
    cut,
    rect,
    text,
    values: text.split('\n').map((row) => row.split('\t')),
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
  const maxRow = bounds.maxRow ?? Infinity
  const maxCol = bounds.maxCol ?? Infinity
  const c0 = colIndex(anchor.col)
  const writes: Writes = []
  for (let r = 0; r < clip.values.length; r++) {
    const row = clip.values[r]
    for (let c = 0; c < row.length; c++) {
      const tr = anchor.row + r
      const tc = c0 + c
      const col = columnLabel(tc)
      if (tr >= maxRow || tc >= maxCol || !col) continue
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
  const maxRow = bounds.maxRow ?? Infinity
  const maxCol = bounds.maxCol ?? Infinity
  const writes: Writes = []
  for (let r = target.rMin; r <= target.rMax; r++) {
    const sourceRowOffset = (r - target.rMin) % clip.values.length
    const row = clip.values[sourceRowOffset] ?? ['']
    for (let c = target.cMin; c <= target.cMax; c++) {
      const col = columnLabel(c)
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
