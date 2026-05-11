import { COL_LETTERS, cellKey, colIndex, type Writes, type WriteCell } from './a1'
import type { Rect } from './rect'

export function rectToTsv(rect: Rect, get: (k: string) => string): string {
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
  anchor: { col: string; row: number },
  write: WriteCell,
  bounds: { maxRow?: number; maxCol?: number; writeMany?: (writes: Writes) => void } = {},
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
