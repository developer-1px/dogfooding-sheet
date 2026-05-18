import { COL_LETTERS, cellKey, colIndex, type CellRef, type Display, type Writes } from '../coordinates/a1'
import type { Rect } from '../geometry/rect'

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

export function writesFromTsv(
  tsv: string,
  anchor: CellRef,
  bounds: { maxRow?: number; maxCol?: number } = {},
): Writes {
  const maxRow = bounds.maxRow ?? Infinity
  const maxCol = bounds.maxCol ?? COL_LETTERS.length
  const rows = tsv.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n')
  const c0 = colIndex(anchor.col)
  const writes: Writes = []
  for (let r = 0; r < rows.length; r++) {
    const cols = rows[r].split('\t')
    for (let c = 0; c < cols.length; c++) {
      const tr = anchor.row + r
      const tc = c0 + c
      const col = COL_LETTERS[tc]
      if (tr >= maxRow || tc >= maxCol || !col) continue
      writes.push([cellKey(col, tr), cols[c]])
    }
  }
  return writes
}

export function writesFromTsvToRect(
  tsv: string,
  target: Rect,
  bounds: { maxRow?: number; maxCol?: number } = {},
): Writes {
  const maxRow = bounds.maxRow ?? Infinity
  const maxCol = bounds.maxCol ?? COL_LETTERS.length
  const rows = tsv.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n')
  const source = rows.map((row) => row.split('\t'))
  const writes: Writes = []
  for (let r = target.rMin; r <= target.rMax; r++) {
    const sourceRow = source[(r - target.rMin) % source.length] ?? ['']
    for (let c = target.cMin; c <= target.cMax; c++) {
      const col = COL_LETTERS[c]
      if (r >= maxRow || c >= maxCol || !col) continue
      const value = sourceRow[(c - target.cMin) % sourceRow.length] ?? ''
      writes.push([cellKey(col, r), value])
    }
  }
  return writes
}
